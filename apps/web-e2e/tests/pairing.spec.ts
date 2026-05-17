// Pairing-wizard @smoke spec (#359). Drives the device-code flow end
// to end against mocked cloud `/pair/*` endpoints — never hits a real
// Glaon cloud or Clerk infra (CLAUDE.md: no real network in E2E).
//
// The CI build sets VITE_E2E_AUTH_STUB=true so Vite aliases
// `@clerk/clerk-react` to `src/__e2e-stubs__/clerk-react.tsx`. The stub
// returns a deterministic signed-in session with a fixed JWT, which
// the wizard reads via `useAuth().getToken()` and forwards to the
// cloud client.

import { expect, test } from './support/test';

import { assertA11y } from './support/a11y';

const PAIR_INITIATE = /\/pair\/initiate$/;
const PAIR_STATUS = /\/pair\/status\?/;

test.describe('pairing wizard @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test('happy path: initiate → awaiting → claimed → switch to cloud', async ({ page }) => {
    let claimedYet = false;
    await page.route(PAIR_INITIATE, async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ code: '424242', expiresAt: Date.now() + 9 * 60 * 1000 }),
      });
    });
    await page.route(PAIR_STATUS, async (route) => {
      // First poll → pending; second poll → claimed.
      if (!claimedYet) {
        claimedYet = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'pending' }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'claimed', homeId: 'home-smoke-1' }),
      });
    });

    await page.goto('/settings/link-to-cloud');
    await expect(page.getByTestId('pair-wizard-awaiting')).toBeVisible();
    await expect(page.getByTestId('pair-wizard-code-value')).toHaveText('424242');

    await expect(page.getByTestId('pair-wizard-claimed')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/home-smoke-1/)).toBeVisible();
    await expect(page.getByTestId('pair-wizard-switch-to-cloud')).toBeVisible();
    await assertA11y(page);
    // The "switch to cloud mode" click triggers a window.location.assign
    // back to '/'. The post-redirect render path is covered by
    // `cloud-mode.spec.ts`; the smoke here stops at "claimed" because
    // the beforeEach init script wipes localStorage on every navigation,
    // which would race with the wizard's post-click writeModePreference.
  });

  test('expired code: surfaces the expired view with restart action', async ({ page }) => {
    await page.route(PAIR_INITIATE, async (route) => {
      // Already-expired code — the wizard's tick fires with Date.now()
      // past expiresAt before it bothers polling.
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ code: '999999', expiresAt: Date.now() - 1_000 }),
      });
    });
    await page.route(PAIR_STATUS, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'expired' }),
      });
    });

    await page.goto('/settings/link-to-cloud');
    await expect(page.getByTestId('pair-wizard-expired')).toBeVisible();
    // Restart fires a fresh initiate — without re-mocking it stays in
    // the expired branch, but the button click should change the state
    // before the stale fetch resolves.
    await expect(page.getByTestId('pair-wizard-restart')).toBeVisible();
  });

  test('rate-limited initiate: surfaces the retry hint', async ({ page }) => {
    await page.route(PAIR_INITIATE, async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'rate-limited',
          code: 'initiate-too-many',
          retryAfterMs: 30_000,
        }),
      });
    });

    await page.goto('/settings/link-to-cloud');
    await expect(page.getByTestId('pair-wizard-error')).toBeVisible();
    await expect(page.getByTestId('pair-wizard-error')).toContainText(/30 seconds/i);
    await expect(page.getByTestId('pair-wizard-restart')).toBeVisible();
  });
});
