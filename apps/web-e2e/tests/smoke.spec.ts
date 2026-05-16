import { expect, test } from '@playwright/test';

import { assertA11y } from './support/a11y';

test.describe('web app @smoke', () => {
  test('renders the local-mode login screen at /', async ({ page }) => {
    // The mode selector (#353) sits in front of the local auth flow on a
    // fresh visit. Pre-seed the local preference so the smoke test lands
    // on the unified LoginPage's Device tab directly (#470) — this spec
    // covers the local-mode happy path, not the picker.
    await page.addInitScript(() => {
      window.localStorage.setItem('glaon.mode-preference', JSON.stringify({ mode: 'local' }));
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: /welcome back/i })).toBeVisible();
    await expect(page.getByTestId('login-device-form')).toBeVisible();
    await assertA11y(page);
  });

  test('has a restrictive CSP meta tag', async ({ page }) => {
    await page.goto('/');
    const csp = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content');
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain('unsafe-eval');
    // #506: Clerk frontend domains must be in script-src so the Cloud
    // sign-in path can load the SDK bundle. A revert that drops them
    // breaks Cloud auth silently in production — guard it here.
    expect(csp).toContain('https://*.clerk.accounts.dev');
    expect(csp).toContain('https://*.clerk.com');
    // script-src itself must not regress to permissive primitives.
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-eval'/);
  });

  test('loads the Tailwind v4 + UUI CSS pipeline', async ({ page }) => {
    // Two-part regression guard.
    //
    // Part 1 (#498): without the `@tailwindcss/vite` plugin and the
    // `@glaon/ui/styles` import, UUI's `theme.css` custom properties
    // never reach the document and `globals.css`'s body rule
    // (`font-family: var(--font-body)`) collapses to the browser
    // default. `--font-body` resolving to a non-empty stack proves the
    // base pipeline ran.
    //
    // Part 2 (#502): `glaon-overrides.css` maps `--color-brand-N` onto
    // `--brand-N` from the Style Dictionary output
    // (`packages/ui/dist/tokens/web.css`). When that file is not
    // imported from `globals.css`, `--brand-500` is unset and the kit
    // Button / Logo accent render unfilled. Asserting `--brand-500`
    // resolves to a hex value catches that wiring being removed.
    await page.goto('/');
    const probes = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return {
        fontBody: root.getPropertyValue('--font-body').trim(),
        brand500: root.getPropertyValue('--brand-500').trim(),
      };
    });
    expect(probes.fontBody.length).toBeGreaterThan(0);
    expect(probes.brand500).toMatch(/^#[0-9a-f]{3,8}$/i);
  });
});
