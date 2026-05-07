import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { InMemoryTokenStore } from '@glaon/core/auth';

import {
  completeLoginCallback,
  deriveClientIdFromOrigin,
  startLoginRedirect,
} from './local-auth-flow';

const HA_CONFIG = {
  baseUrl: 'http://homeassistant.local:8123',
  clientId: 'http://localhost:5173/',
};
const REDIRECT_URI = 'http://localhost:5173/auth/callback';

describe('deriveClientIdFromOrigin', () => {
  it('appends a trailing slash when missing', () => {
    expect(deriveClientIdFromOrigin('http://localhost:5173')).toBe('http://localhost:5173/');
  });

  it('preserves an existing trailing slash', () => {
    expect(deriveClientIdFromOrigin('http://localhost:5173/')).toBe('http://localhost:5173/');
  });
});

describe('startLoginRedirect', () => {
  beforeEach(() => {
    window.name = '';
  });

  it('returns an HA authorize URL with the expected query parameters', async () => {
    const { redirectUrl } = await startLoginRedirect(HA_CONFIG, REDIRECT_URI);
    const url = new URL(redirectUrl);

    expect(url.origin).toBe('http://homeassistant.local:8123');
    expect(url.pathname).toBe('/auth/authorize');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('client_id')).toBe(HA_CONFIG.clientId);
    expect(url.searchParams.get('redirect_uri')).toBe(REDIRECT_URI);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('state')).toBeTruthy();
    expect(url.searchParams.get('code_challenge')).toBeTruthy();
  });

  it('persists the PKCE flow state across the redirect via window.name', async () => {
    await startLoginRedirect(HA_CONFIG, REDIRECT_URI);
    expect(window.name).toMatch(/^glaon-pkce:/);
    const flow = JSON.parse(window.name.replace(/^glaon-pkce:/, '')) as {
      state: string;
      codeVerifier: string;
    };
    expect(flow.state).toBeTruthy();
    expect(flow.codeVerifier).toHaveLength(64);
  });
});

describe('completeLoginCallback', () => {
  const fakeFetch = vi.fn();

  beforeEach(() => {
    window.name = '';
    fakeFetch.mockReset();
    vi.stubGlobal('fetch', fakeFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns no-pending-flow when window.name has no PKCE state', async () => {
    const tokenStore = new InMemoryTokenStore();
    const result = await completeLoginCallback(
      HA_CONFIG,
      REDIRECT_URI,
      { code: 'abc', state: 'x' },
      tokenStore,
    );
    expect(result).toEqual({ outcome: 'error', reason: 'no-pending-flow' });
  });

  it('returns state-mismatch when the URL state does not match the stored one', async () => {
    await startLoginRedirect(HA_CONFIG, REDIRECT_URI);
    const tokenStore = new InMemoryTokenStore();
    const result = await completeLoginCallback(
      HA_CONFIG,
      REDIRECT_URI,
      { code: 'abc', state: 'wrong' },
      tokenStore,
    );
    expect(result).toEqual({ outcome: 'error', reason: 'state-mismatch' });
  });

  it('returns token-exchange-failed when HA responds non-2xx', async () => {
    await startLoginRedirect(HA_CONFIG, REDIRECT_URI);
    const flow = JSON.parse(window.name.replace(/^glaon-pkce:/, '')) as { state: string };
    fakeFetch.mockResolvedValueOnce(new Response('bad', { status: 400 }));

    const tokenStore = new InMemoryTokenStore();
    const result = await completeLoginCallback(
      HA_CONFIG,
      REDIRECT_URI,
      { code: 'abc', state: flow.state },
      tokenStore,
    );
    expect(result.outcome).toBe('error');
    if (result.outcome === 'error') {
      expect(result.reason).toBe('token-exchange-failed');
    }
  });

  it('persists ha-access + ha-refresh on success and returns the tokens', async () => {
    await startLoginRedirect(HA_CONFIG, REDIRECT_URI);
    const flow = JSON.parse(window.name.replace(/^glaon-pkce:/, '')) as { state: string };
    fakeFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          access_token: 'access-1',
          refresh_token: 'refresh-1',
          expires_in: 1800,
          token_type: 'Bearer',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const tokenStore = new InMemoryTokenStore();
    const result = await completeLoginCallback(
      HA_CONFIG,
      REDIRECT_URI,
      { code: 'abc', state: flow.state },
      tokenStore,
    );

    expect(result.outcome).toBe('ok');
    if (result.outcome === 'ok') {
      expect(result.tokens.access_token).toBe('access-1');
      expect(result.tokens.refresh_token).toBe('refresh-1');
    }
    const stored = await tokenStore.get('ha-access');
    expect(stored?.token).toBe('access-1');
    const refresh = await tokenStore.get('ha-refresh');
    expect(refresh?.token).toBe('refresh-1');
  });

  it('clears the pending flow after consumption (single-use)', async () => {
    await startLoginRedirect(HA_CONFIG, REDIRECT_URI);
    const flow = JSON.parse(window.name.replace(/^glaon-pkce:/, '')) as { state: string };
    fakeFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          access_token: 'access-1',
          refresh_token: 'refresh-1',
          expires_in: 1800,
          token_type: 'Bearer',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const tokenStore = new InMemoryTokenStore();
    await completeLoginCallback(
      HA_CONFIG,
      REDIRECT_URI,
      { code: 'abc', state: flow.state },
      tokenStore,
    );
    expect(window.name).toBe('');
  });
});
