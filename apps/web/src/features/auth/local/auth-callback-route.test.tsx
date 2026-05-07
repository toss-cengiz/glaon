import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { InMemoryTokenStore } from '@glaon/core/auth';

import { AuthProvider } from '../../../auth/auth-provider';
import { startLoginRedirect } from '../../../auth/local-auth-flow';

import { AuthCallbackRoute } from './auth-callback-route';

const HA_CONFIG = {
  baseUrl: 'http://homeassistant.local:8123',
  clientId: 'http://localhost:5173/',
};
const REDIRECT_URI = 'http://localhost:5173/auth/callback';

describe('AuthCallbackRoute', () => {
  const fakeFetch = vi.fn();

  beforeEach(() => {
    window.name = '';
    fakeFetch.mockReset();
    vi.stubGlobal('fetch', fakeFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows pending then success when state matches and HA returns tokens', async () => {
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
    const onSuccess = vi.fn();
    const readSearch = () => `?code=abc&state=${flow.state}`;

    render(
      <AuthProvider tokenStore={tokenStore}>
        <AuthCallbackRoute
          config={HA_CONFIG}
          redirectUri={REDIRECT_URI}
          readSearch={readSearch}
          onSuccess={onSuccess}
        />
      </AuthProvider>,
    );

    expect(screen.getByTestId('auth-callback-pending')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('auth-callback-success')).toBeInTheDocument();
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('renders a state-mismatch error when state does not match', async () => {
    await startLoginRedirect(HA_CONFIG, REDIRECT_URI);

    const tokenStore = new InMemoryTokenStore();
    const readSearch = () => '?code=abc&state=not-the-real-state';

    render(
      <AuthProvider tokenStore={tokenStore}>
        <AuthCallbackRoute config={HA_CONFIG} redirectUri={REDIRECT_URI} readSearch={readSearch} />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-callback-error-state-mismatch')).toBeInTheDocument();
    });
  });

  it('renders a no-pending-flow error when there is nothing in window.name', async () => {
    const tokenStore = new InMemoryTokenStore();
    const readSearch = () => '?code=abc&state=anything';

    render(
      <AuthProvider tokenStore={tokenStore}>
        <AuthCallbackRoute config={HA_CONFIG} redirectUri={REDIRECT_URI} readSearch={readSearch} />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-callback-error-no-pending-flow')).toBeInTheDocument();
    });
  });

  it('renders a token-exchange-failed error when HA returns non-2xx', async () => {
    await startLoginRedirect(HA_CONFIG, REDIRECT_URI);
    const flow = JSON.parse(window.name.replace(/^glaon-pkce:/, '')) as { state: string };
    fakeFetch.mockResolvedValueOnce(new Response('bad', { status: 401 }));

    const tokenStore = new InMemoryTokenStore();
    const readSearch = () => `?code=abc&state=${flow.state}`;

    render(
      <AuthProvider tokenStore={tokenStore}>
        <AuthCallbackRoute config={HA_CONFIG} redirectUri={REDIRECT_URI} readSearch={readSearch} />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-callback-error-token-exchange-failed')).toBeInTheDocument();
    });
  });
});
