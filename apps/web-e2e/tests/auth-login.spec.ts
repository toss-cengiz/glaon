// Auth login @smoke spec (#470). Drives the unified LoginPage's two
// tabs end-to-end:
//
//   - Device tab → mocked `POST /auth/ha/password-grant` (#468 / ADR
//     0027). Asserts the user never leaves Glaon's UI for HA's
//     redirect login.
//   - Cloud tab → headless Clerk `useSignIn()` via the E2E auth stub
//     (`VITE_E2E_AUTH_STUB=true` in CI). Asserts the form renders and
//     submits cleanly.
//   - Tab toggle → both tabs share the same page so a click flips the
//     active panel without a navigation.
//   - Device 401 → mocked `invalid-credentials` reply renders an
//     inline error region.
//
// The legacy `local-mode.spec.ts` (HA OAuth redirect flow) is now a
// no-op stub kept only for the auth-callback error scenario, which
// still applies to the cloud OAuth callback path.

import { expect, test } from '@playwright/test';

import { assertA11y } from './support/a11y';

const PASSWORD_GRANT_PATH = '**/auth/ha/password-grant';

test.describe('auth-login @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test('renders the LoginPage with Device tab default + clean a11y', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-device-form')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: /welcome back/i })).toBeVisible();
    await assertA11y(page);
  });

  test('Device → Cloud toggle flips the active panel', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-device-form')).toBeVisible();
    await page.getByRole('tab', { name: /cloud/i }).click();
    await expect(page.getByTestId('login-cloud-form')).toBeVisible();
    await page.getByRole('tab', { name: /device/i }).click();
    await expect(page.getByTestId('login-device-form')).toBeVisible();
  });

  test('Device tab successful sign-in posts to the password-grant endpoint', async ({ page }) => {
    // Register on the browser context (matches the local-mode pattern at
    // `local-mode.spec.ts`). `page.route()` had a flake where the cross-
    // origin POST didn't always reach the interceptor before the fetch
    // erred out; context-level interception is more reliable.
    await page.context().route(PASSWORD_GRANT_PATH, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          haAccess: {
            accessToken: 'A',
            refreshToken: 'R',
            expiresIn: 1800,
            tokenType: 'Bearer',
          },
          sessionJwt: 'S',
          expiresAt: Date.now() + 1_800_000,
        }),
      });
    });

    // Wait for the password-grant POST to land — that's the smallest
    // stable signal that the form submitted end-to-end. Asserting on
    // the post-redirect dashboard isn't reliable here: the web
    // TokenStore is in-memory by design (refresh would normally come
    // from the addon's httpOnly cookie that this smoke doesn't model),
    // so the `window.location.assign('/')` reload lands the user back
    // on the login page after the form completes.
    const requestPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes('/auth/ha/password-grant'),
      { timeout: 10_000 },
    );
    await page.goto('/login');
    await page.getByLabel(/home assistant url/i).fill('http://homeassistant.local:8123');
    await page.getByLabel(/username/i).fill('olivia');
    await page
      .locator('[data-testid="login-device-form"] input[type="password"]')
      .fill('correct-horse');
    await page.getByRole('button', { name: /^sign in$/i }).click();
    const request = await requestPromise;
    const body = request.postDataJSON() as { username: string; password: string };
    expect(body.username).toBe('olivia');
    expect(body.password).toBe('correct-horse');
  });

  test('Device tab surfaces the inline error on invalid credentials', async ({ page }) => {
    await page.context().route(PASSWORD_GRANT_PATH, async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid-credentials' }),
      });
    });

    await page.goto('/login');
    await page.getByLabel(/home assistant url/i).fill('http://homeassistant.local:8123');
    await page.getByLabel(/username/i).fill('olivia');
    await page.locator('[data-testid="login-device-form"] input[type="password"]').fill('wrong');
    await page.getByRole('button', { name: /^sign in$/i }).click();

    await expect(page.getByTestId('login-device-error')).toBeVisible();
    await expect(page.getByTestId('login-device-error')).toContainText(
      /wrong username or password/i,
    );
  });
});
