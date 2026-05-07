// Local-mode HA OAuth2 PKCE flow (web). Pure functions composing @glaon/core/auth helpers
// with the WebTokenStore boundary — no React, no DOM-side-effects. The route components
// import these and wire them to URL navigation + TokenStore.

import {
  buildAuthorizationRequest,
  exchangeCodeForTokens,
  refreshAccessToken,
  type AuthorizationRequest,
  type HaConnectionConfig,
  type HaAuthTokens,
  type StoredCredential,
  type TokenStore,
} from '@glaon/core/auth';

interface PendingFlow {
  readonly state: string;
  readonly codeVerifier: string;
}

// Mid-flight PKCE state must survive the OAuth2 redirect (HA → callback). `window.name` is a
// tab-local channel that the browser preserves across navigations within the same tab — it is
// not a storage primitive (no XSS exfiltration target across origins for our SPA). The
// verifier here is single-use and bound to a specific code exchange; HA itself will receive
// the same verifier in the /auth/token POST a moment later, so leaking it to HA in `window.name`
// is not a marginal increase in surface. localStorage / sessionStorage are forbidden in
// apps/web/src/auth/** by the ESLint guard; this approach honors that without an inline
// disable.
const WINDOW_NAME_PREFIX = 'glaon-pkce:';

function persistPendingFlow(flow: PendingFlow): void {
  window.name = `${WINDOW_NAME_PREFIX}${JSON.stringify(flow)}`;
}

function readAndClearPendingFlow(): PendingFlow | null {
  const raw = window.name;
  if (!raw.startsWith(WINDOW_NAME_PREFIX)) return null;
  const json = raw.slice(WINDOW_NAME_PREFIX.length);
  window.name = '';
  try {
    return JSON.parse(json) as PendingFlow;
  } catch {
    return null;
  }
}

interface StartLoginResult {
  readonly redirectUrl: string;
}

/**
 * Compute the HA authorize URL and stash the PKCE verifier so the callback can consume it.
 *
 * The caller is responsible for the actual `window.location.assign(redirectUrl)` — keeping
 * navigation as a side effect at the call site makes this function safe to unit-test under
 * jsdom.
 */
export async function startLoginRedirect(
  config: HaConnectionConfig,
  redirectUri: string,
): Promise<StartLoginResult> {
  const request: AuthorizationRequest = await buildAuthorizationRequest(config, redirectUri);
  persistPendingFlow({ state: request.state, codeVerifier: request.codeVerifier });
  return { redirectUrl: request.url };
}

export type CompleteLoginCallbackResult =
  | { readonly outcome: 'ok'; readonly tokens: HaAuthTokens }
  | {
      readonly outcome: 'error';
      readonly reason: 'state-mismatch' | 'no-pending-flow' | 'token-exchange-failed';
      readonly cause?: unknown;
    };

/**
 * Validate the OAuth callback URL params, exchange the code for tokens, and persist
 * `ha-access` (in-memory) + signal `ha-refresh` (a no-op on web — the addon proxy already
 * set the httpOnly cookie via Set-Cookie on /auth/token).
 */
export async function completeLoginCallback(
  config: HaConnectionConfig,
  redirectUri: string,
  callbackParams: { readonly code: string | null; readonly state: string | null },
  tokenStore: TokenStore,
): Promise<CompleteLoginCallbackResult> {
  const pending = readAndClearPendingFlow();
  if (!pending) {
    return { outcome: 'error', reason: 'no-pending-flow' };
  }
  if (callbackParams.state !== pending.state) {
    return { outcome: 'error', reason: 'state-mismatch' };
  }
  if (callbackParams.code === null || callbackParams.code === '') {
    return { outcome: 'error', reason: 'token-exchange-failed' };
  }
  let tokens: HaAuthTokens;
  try {
    tokens = await exchangeCodeForTokens(
      config,
      redirectUri,
      callbackParams.code,
      pending.codeVerifier,
    );
  } catch (cause) {
    return { outcome: 'error', reason: 'token-exchange-failed', cause };
  }
  await tokenStore.set(toAccessCredential(tokens));
  // ha-refresh is a no-op on WebTokenStore — the addon nginx proxy already set the cookie
  // via Set-Cookie on /auth/token. We pass it through anyway so a non-web TokenStore
  // (e.g. a test fixture or a future implementation) can still observe the refresh value.
  await tokenStore.set({ kind: 'ha-refresh', token: tokens.refresh_token });
  return { outcome: 'ok', tokens };
}

/**
 * Refresh the ha-access slot. Caller is expected to wrap this in `RefreshMutex.run('ha-access', ...)`
 * to coalesce concurrent refresh attempts.
 *
 * @public — invoked by `HaClient.DirectWsTransport` (#10) when HA returns `auth_invalid` on
 * an open WebSocket; lands here as the local-mode refresh primitive ahead of that wiring.
 */
export async function refreshLocalAccessToken(
  config: HaConnectionConfig,
  refreshToken: string,
  tokenStore: TokenStore,
): Promise<HaAuthTokens> {
  const tokens = await refreshAccessToken(config, refreshToken);
  await tokenStore.set(toAccessCredential(tokens));
  return tokens;
}

function toAccessCredential(tokens: HaAuthTokens): StoredCredential {
  const expiresAt = tokens.issued_at + tokens.expires_in * 1000;
  return {
    kind: 'ha-access',
    token: tokens.access_token,
    expiresAt,
  };
}

/**
 * Derive a HA OAuth `client_id` from the current origin. HA only accepts URL-shaped client
 * ids that point to the redirect destination host — see CLAUDE.md HA Notes.
 */
export function deriveClientIdFromOrigin(origin: string): string {
  // Trailing slash is canonical; HA tolerates either form.
  return origin.endsWith('/') ? origin : `${origin}/`;
}
