// Local-mode HA OAuth2 PKCE flow (mobile). Wraps `expo-auth-session` so the rest of the app
// can consume the same `AuthMode { kind: 'local', tokens }` shape the web side emits.
//
// expo-auth-session generates the PKCE pair and handles the in-app browser handoff
// (ASWebAuthenticationSession on iOS, Custom Tabs on Android). We do not need the
// `@glaon/core/auth` raw fetch helpers here — the platform primitive does the
// authorize-redirect-exchange dance natively.

import {
  AuthRequest,
  CodeChallengeMethod,
  ResponseType,
  exchangeCodeAsync,
  makeRedirectUri,
  type AuthSessionResult,
  type DiscoveryDocument,
  type TokenResponseConfig,
} from 'expo-auth-session';

import type { HaAuthTokens, StoredCredential, TokenStore } from '@glaon/core/auth';

export interface LocalAuthFlowConfig {
  /** HA base URL (e.g. `http://homeassistant.local:8123`). */
  readonly baseUrl: string;
  /** HA URL-as-id (e.g. `https://glaon.app/`). */
  readonly clientId: string;
  /** Deep link scheme registered in app.json (e.g. `glaon`). */
  readonly redirectScheme: string;
}

export function buildDiscovery(baseUrl: string): DiscoveryDocument {
  return {
    authorizationEndpoint: `${stripTrailingSlash(baseUrl)}/auth/authorize`,
    tokenEndpoint: `${stripTrailingSlash(baseUrl)}/auth/token`,
  };
}

function buildRedirectUri(scheme: string): string {
  // Path matches the addon Ingress + standalone web route — keeps redirect handling
  // symmetrical between platforms.
  return makeRedirectUri({ scheme, path: 'auth/callback' });
}

export function buildAuthRequest(config: LocalAuthFlowConfig): AuthRequest {
  return new AuthRequest({
    clientId: config.clientId,
    redirectUri: buildRedirectUri(config.redirectScheme),
    responseType: ResponseType.Code,
    scopes: [],
    usePKCE: true,
    codeChallengeMethod: CodeChallengeMethod.S256,
  });
}

type CompleteAuthResult =
  | { readonly outcome: 'ok'; readonly tokens: HaAuthTokens }
  | { readonly outcome: 'cancel' }
  | {
      readonly outcome: 'error';
      readonly reason: 'token-exchange-failed';
      readonly cause?: unknown;
    };

/**
 * Consume the result of `request.promptAsync(...)` and finalize the flow:
 *  1. Bail on user-cancel / dismiss.
 *  2. Bail on a missing `code`.
 *  3. Exchange `code` + `code_verifier` for tokens via `expo-auth-session`.
 *  4. Persist into the `TokenStore` (mobile binds to expo-secure-store via #9).
 */
export async function completeAuthFlow(
  config: LocalAuthFlowConfig,
  request: AuthRequest,
  result: AuthSessionResult,
  tokenStore: TokenStore,
): Promise<CompleteAuthResult> {
  if (result.type === 'cancel' || result.type === 'dismiss') {
    return { outcome: 'cancel' };
  }
  if (result.type !== 'success' || result.params.code === undefined) {
    return { outcome: 'error', reason: 'token-exchange-failed' };
  }
  const verifier = request.codeVerifier;
  if (verifier === undefined) {
    return { outcome: 'error', reason: 'token-exchange-failed' };
  }
  let tokenResp: TokenResponseConfig;
  try {
    const exchanged = await exchangeCodeAsync(
      {
        clientId: config.clientId,
        code: result.params.code,
        redirectUri: buildRedirectUri(config.redirectScheme),
        extraParams: { code_verifier: verifier },
      },
      buildDiscovery(config.baseUrl),
    );
    tokenResp = exchanged.getRequestConfig();
  } catch (cause) {
    return { outcome: 'error', reason: 'token-exchange-failed', cause };
  }

  const tokens = toHaAuthTokens(tokenResp);
  if (tokens === null) {
    return { outcome: 'error', reason: 'token-exchange-failed' };
  }
  await tokenStore.set(toAccessCredential(tokens));
  await tokenStore.set({ kind: 'ha-refresh', token: tokens.refresh_token });
  return { outcome: 'ok', tokens };
}

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function toHaAuthTokens(config: TokenResponseConfig): HaAuthTokens | null {
  if (config.refreshToken === undefined) {
    // HA always returns a refresh token on the first exchange; missing it indicates a
    // token-endpoint misconfiguration that we surface as a flow failure.
    return null;
  }
  return {
    access_token: config.accessToken,
    refresh_token: config.refreshToken,
    expires_in: config.expiresIn ?? 1800,
    issued_at: Date.now(),
    token_type: 'Bearer',
  };
}

function toAccessCredential(tokens: HaAuthTokens): StoredCredential {
  return {
    kind: 'ha-access',
    token: tokens.access_token,
    expiresAt: tokens.issued_at + tokens.expires_in * 1000,
  };
}
