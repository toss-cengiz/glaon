// Local-mode @smoke spec — superseded by `auth-login.spec.ts` (#470).
//
// The HA OAuth Authorization Code redirect flow that this spec used to
// test is no longer the Device-mode entry path: `apps/api`'s
// `POST /auth/ha/password-grant` proxy (#468 / ADR 0027) takes
// credentials from Glaon's own UI and the user never sees HA's
// redirect login page. The new flow's coverage lives in
// `auth-login.spec.ts`.
//
// We keep the `auth/callback` mismatched-state assertion here because
// the callback route still handles cloud OAuth (Google / Apple)
// returns — that's the only redirect-style path Glaon retains. The
// "full PKCE round-trip" test that #486 added on development tested the
// LoginRoute → /auth/authorize redirect that this PR removes; it is
// not carried over because the user-visible button it drives
// (`login-start`) no longer exists in the unified LoginPage.

import { expect, test } from '@playwright/test';

test.describe('auth-callback @smoke', () => {
  test('callback with mismatched state surfaces a user-visible error', async ({ page }) => {
    // Landing on /auth/callback directly with a fabricated state means no
    // pending flow exists; the route surfaces the "no-pending-flow" error
    // region (stable data-testid contract).
    await page.goto('/auth/callback?code=anything&state=wrong-state');
    await expect(page.getByTestId('auth-callback-error-no-pending-flow')).toBeVisible();
  });
});
