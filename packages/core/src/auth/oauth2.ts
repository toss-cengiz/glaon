import type { HaAuthTokens, HaConnectionConfig } from '../types';
import { deriveCodeChallenge, generateCodeVerifier } from './pkce';

export interface AuthorizationRequest {
  readonly url: string;
  readonly state: string;
  readonly codeVerifier: string;
}

export async function buildAuthorizationRequest(
  config: HaConnectionConfig,
  redirectUri: string,
): Promise<AuthorizationRequest> {
  const state = generateCodeVerifier(32);
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await deriveCodeChallenge(codeVerifier);

  const url = new URL('/auth/authorize', config.baseUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');

  return { url: url.toString(), state, codeVerifier };
}

export async function exchangeCodeForTokens(
  config: HaConnectionConfig,
  redirectUri: string,
  code: string,
  codeVerifier: string,
): Promise<HaAuthTokens> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: config.clientId,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(new URL('/auth/token', config.baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${String(response.status)}`);
  }

  const raw = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: 'Bearer';
  };

  return { ...raw, issued_at: Date.now() };
}

export async function refreshAccessToken(
  config: HaConnectionConfig,
  refreshToken: string,
): Promise<HaAuthTokens> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.clientId,
    refresh_token: refreshToken,
  });

  const response = await fetch(new URL('/auth/token', config.baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${String(response.status)}`);
  }

  const raw = (await response.json()) as {
    access_token: string;
    expires_in: number;
    token_type: 'Bearer';
  };

  return { ...raw, refresh_token: refreshToken, issued_at: Date.now() };
}
