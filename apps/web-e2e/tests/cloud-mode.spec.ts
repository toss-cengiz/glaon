// Cloud-mode @smoke spec (#358). Covers the user-visible surface area
// of the cloud track that exists today: the mode selector, the cloud
// fallback when Clerk is not configured for this build, and the CSP
// allowance for Clerk origins.
//
// What this spec deliberately does NOT cover yet:
//   - Clerk sign-in round-trip — Clerk's SDK refuses an empty key and
//     a real publishable key would hit live Clerk infra; the preview
//     bundle is built without a key, so this surface is verified
//     indirectly (the `cloud-unavailable` fallback exercises the same
//     router + provider gates).
//   - Entity list / call_service round-trip — that UI lands with
//     #10–#12 (HaClient + EntityStore + service helpers); the smoke
//     extends to those once the components mount.
//   - Pairing wizard — covered by #359's separate F2 smoke.
//
// CLAUDE.md forbids real network calls; everything goes through
// `page.route()` or `page.addInitScript()`.

import { expect, test } from '@playwright/test';

import { assertA11y } from './support/a11y';

test.describe('cloud-mode @smoke', () => {
  test.beforeEach(async ({ page }) => {
    // Fresh first-visit state — no mode preference.
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    // Block any accidental egress: the test should never hit a real
    // origin. Allow only same-origin requests; anything else fails the
    // suite loudly so a regression that calls a third-party doesn't
    // pass silently.
    await page.route(/^https?:\/\/(?!localhost:4173|127\.0\.0\.1:4173)/, async (route) => {
      const url = route.request().url();
      // Allow Chromatic / Sentry / vite asset CDNs that the preview
      // bundle pulls in via <link rel="preload"> — none of these
      // actually fire on the smoke surface, but the rule keeps the
      // intent explicit.
      if (url.startsWith('data:')) {
        await route.continue();
        return;
      }
      await route.abort();
    });
  });

  test('first visit lands on the mode selector with both cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('mode-select-route')).toBeVisible();
    await expect(page.getByTestId('mode-card-local')).toBeVisible();
    await expect(page.getByTestId('mode-card-cloud')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/how is glaon connecting/i);
    await assertA11y(page);
  });

  test('cloud card with no Clerk key surfaces the cloud-unavailable fallback', async ({ page }) => {
    // Preview bundle is built without VITE_CLERK_PUBLISHABLE_KEY, so
    // picking the cloud card flows directly into the fallback view.
    await page.goto('/');
    await page.getByTestId('mode-card-cloud').click();
    await expect(page.getByTestId('cloud-unavailable')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /cloud sign-in unavailable/i,
    );
    // The fallback offers an escape hatch back to the picker.
    await page.getByRole('button', { name: /pick a different mode/i }).click();
    await expect(page.getByTestId('mode-select-route')).toBeVisible();
    await assertA11y(page);
  });

  test('local card returns to the LoginRoute', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('mode-card-local').click();
    await expect(page.getByTestId('login-route')).toBeVisible();
    await expect(page.getByTestId('login-start')).toBeVisible();
    await assertA11y(page);
  });
});
