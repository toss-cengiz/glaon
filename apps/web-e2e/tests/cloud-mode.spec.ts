// Cloud-mode @smoke spec (#358). Covers the user-visible surface area
// of the cloud track that exists today: the mode selector, the cloud
// sign-in route, and the local fallback.
//
// The CI bundle is built with VITE_CLERK_PUBLISHABLE_KEY +
// VITE_E2E_AUTH_STUB=true (#359). Vite aliases `@clerk/clerk-react` to
// `apps/web/src/__e2e-stubs__/clerk-react.tsx`, which returns a
// deterministic signed-in session and renders simple <SignIn> /
// <SignUp> placeholders. That keeps the smoke off Clerk's real network
// while still exercising the full router + provider tree.
//
// What this spec deliberately does NOT cover yet:
//   - Entity list / call_service round-trip — that UI lands with
//     #10–#12 (HaClient + EntityStore + service helpers); the smoke
//     extends to those once the components mount.
//   - Pairing wizard — covered by `pairing.spec.ts` (#359).
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

  test('cloud card routes to the sign-in screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('mode-card-cloud')).not.toBeDisabled();
    await page.getByTestId('mode-card-cloud').click();
    await expect(page.getByTestId('cloud-sign-in-route')).toBeVisible();
    await expect(page.getByTestId('stub-sign-in')).toBeVisible();
  });

  test('local card returns to the LoginRoute', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('mode-card-local').click();
    await expect(page.getByTestId('login-route')).toBeVisible();
    await expect(page.getByTestId('login-start')).toBeVisible();
    await assertA11y(page);
  });
});
