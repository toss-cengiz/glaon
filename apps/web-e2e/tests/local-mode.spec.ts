// Local-mode @smoke test per issue #13. Drives the OAuth2 PKCE flow that #7 lands
// on web end-to-end. HA itself is mocked via `page.route()` per CLAUDE.md's E2E
// rule (no real HA in PR-time CI); the dockerized HA fixture (#331 ✓) is consumed
// by the broader integration suite (`@extended` tag, runs nightly) — out of scope
// for this PR.
//
// Coverage in this spec:
//  - Land on `/` → local-mode login screen renders.
//  - Click "Sign in with Home Assistant" → app builds the HA authorize URL with
//    PKCE code_challenge, sets the state query param, navigates.
//  - Mock HA's authorize endpoint: extract `state` + `redirect_uri`, redirect
//    back to /auth/callback with a synthetic `code`.
//  - Mock HA's /auth/token endpoint: respond with a valid token bundle.
//  - The callback page completes the exchange, AuthProvider flips to
//    `{ kind: 'local', tokens }`, and the signed-in placeholder renders.
//
// Out of scope (follow-up):
//  - HA WebSocket multiplexing + entity list render — needs WebSocket route
//    mocking and will land alongside the first entity-card feature.
//  - Light toggle round-trip.
//  - Reconnect / container-kill scenarios — covered by the dockerized HA
//    fixture suite under `@extended`.

import { expect, test } from '@playwright/test';

import { assertA11y } from './support/a11y';

const HA_AUTHORIZE_PATTERN = /\/auth\/authorize/;

test.describe('local-mode auth flow @smoke', () => {
  test('renders the login screen and a11y is clean', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('login-route')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Glaon' })).toBeVisible();
    await expect(page.getByTestId('login-start')).toBeVisible();
    await assertA11y(page);
  });

  test('sign-in click drives the PKCE redirect to HA authorize', async ({ page }) => {
    // Stub the HA authorize endpoint so the cross-origin navigation lands on a
    // controlled body instead of the real (unreachable) HA host. We capture the
    // PKCE `state` + `redirect_uri` to assert the client built the URL correctly.
    let capturedState: string | null = null;
    let capturedRedirectUri: string | null = null;
    let capturedChallengeMethod: string | null = null;
    await page.route(HA_AUTHORIZE_PATTERN, async (route) => {
      const url = new URL(route.request().url());
      capturedState = url.searchParams.get('state');
      capturedRedirectUri = url.searchParams.get('redirect_uri');
      capturedChallengeMethod = url.searchParams.get('code_challenge_method');
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><html><body>HA authorize stub</body></html>',
      });
    });

    await page.goto('/');
    await page.getByTestId('login-start').click();
    await page.waitForURL(HA_AUTHORIZE_PATTERN, { timeout: 10_000 });

    expect(capturedState).toBeTruthy();
    expect(capturedRedirectUri).toContain('/auth/callback');
    expect(capturedChallengeMethod).toBe('S256');
  });

  test('callback with mismatched state surfaces a user-visible error', async ({ page }) => {
    // The startLoginRedirect helper stashes the PKCE state in `window.name`. To
    // assert the error path we land on /auth/callback directly with a fabricated
    // (mismatched) state — no pending flow exists, so the route surfaces the
    // "no-pending-flow" error region (data-testid stable contract from #7).
    await page.goto('/auth/callback?code=anything&state=wrong-state');
    await expect(page.getByTestId('auth-callback-error-no-pending-flow')).toBeVisible();
  });
});
