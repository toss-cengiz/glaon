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
  });

  test('loads the Tailwind v4 + UUI CSS pipeline', async ({ page }) => {
    // Regression guard for #498. Without the `@tailwindcss/vite` plugin
    // and the `@glaon/ui/styles` import wired into apps/web, UUI's
    // `theme.css` custom properties never reach the document and
    // `globals.css`'s body rule (`font-family: var(--font-body)`)
    // collapses to the browser default. Asserting the custom property
    // is resolved is the cleanest signal that the pipeline ran.
    await page.goto('/');
    const fontBody = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--font-body').trim(),
    );
    expect(fontBody.length).toBeGreaterThan(0);
  });
});
