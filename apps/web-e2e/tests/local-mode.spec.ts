// Local-mode @smoke test per issue #13. Drives the OAuth2 PKCE flow that #7 lands
// on web end-to-end. HA itself is mocked via `page.route()` per CLAUDE.md's E2E
// rule (no real HA in PR-time CI); the dockerized HA fixture (#331 ✓) is consumed
// by the broader integration suite (`@extended` tag, runs nightly) — out of scope
// for this PR.
//
// Coverage in this spec (each test scopes to one slice of the journey to keep
// failure isolation tight):
//  1. Login screen renders + a11y is clean.
//  2. Sign-in click drives the PKCE redirect to HA `/auth/authorize` with the
//     correct query params.
//  3. Mismatched callback state surfaces the user-visible error region.
//  4. Full happy path — authorize stub redirects back, /auth/token mock returns
//     a token bundle, AuthProvider flips, and the signed-in shell renders.
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
  test.beforeEach(async ({ page }) => {
    // The mode selector (#353) intercepts a fresh visit; this suite covers
    // the local OAuth flow specifically, so pre-seed the local-mode
    // preference into localStorage before the page loads.
    await page.addInitScript(() => {
      window.localStorage.setItem('glaon.mode-preference', JSON.stringify({ mode: 'local' }));
    });
  });

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

  test('full PKCE round-trip → token exchange → signed-in shell renders', async ({ page }) => {
    // Authorize stub: capture the state Glaon emits, then 302 the browser back
    // to the same-origin /auth/callback with that state echoed verbatim. The
    // PKCE verifier is parked in `window.name`, which the browser preserves
    // across same-tab cross-origin navigations — so the verifier survives the
    // redirect and the callback can complete the exchange.
    let capturedState: string | null = null;
    let capturedRedirectUri: string | null = null;
    await page.route(HA_AUTHORIZE_PATTERN, async (route) => {
      const url = new URL(route.request().url());
      capturedState = url.searchParams.get('state');
      capturedRedirectUri = url.searchParams.get('redirect_uri');
      const target = new URL(capturedRedirectUri ?? '/auth/callback', 'http://localhost:4173');
      target.searchParams.set('code', 'fake-authorization-code');
      target.searchParams.set('state', capturedState ?? '');
      await route.fulfill({
        status: 302,
        headers: { location: target.toString() },
      });
    });

    // Token exchange stub: respond with a deterministic bundle. The body is
    // `application/x-www-form-urlencoded` per RFC 6749 §4.1.3; we don't read
    // it here because the verifier match is HA's job in production — the smoke
    // is asserting Glaon's side: it sends the request, parses the response,
    // and the AuthProvider flips.
    let tokenRequestSeen = false;
    await page.route(/homeassistant\.local:8123\/auth\/token$/, async (route) => {
      tokenRequestSeen = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'aaaaaa.bbbbbb.cccccc',
          refresh_token: 'rrrrrr.tttttt.uuuuuu',
          expires_in: 1800,
          token_type: 'Bearer',
        }),
      });
    });

    await page.goto('/');
    await page.getByTestId('login-start').click();

    // Browser follows the authorize stub's 302 back to /auth/callback. The
    // signed-in shell renders once setLocalAuth fires + onSuccess redirects
    // to '/'. We assert on the shell's user-visible heading (the one the
    // language-policy keeps stable as 'Glaon' across locales) and the
    // Switch-mode affordance landing as a stable testid.
    await expect(page.getByRole('heading', { level: 1, name: 'Glaon' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('switch-mode')).toBeVisible();

    expect(tokenRequestSeen).toBe(true);
    expect(capturedRedirectUri).toContain('/auth/callback');
    expect(capturedState).toBeTruthy();
  });
});
