import { act, render, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InMemoryTokenStore, type HaAuthTokens } from '@glaon/core/auth';

import { AuthProvider, useAuth } from './auth-provider';

const TOKENS: HaAuthTokens = {
  access_token: 'access-1',
  refresh_token: 'refresh-1',
  expires_in: 1800,
  issued_at: 1_700_000_000_000,
  token_type: 'Bearer',
};

function wrapper(tokenStore: InMemoryTokenStore) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <AuthProvider tokenStore={tokenStore}>{children}</AuthProvider>;
  };
}

describe('AuthProvider', () => {
  it('exposes mode=null when no token is in the store', () => {
    const tokenStore = new InMemoryTokenStore();
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(tokenStore) });
    expect(result.current.mode).toBeNull();
  });

  it('emits AuthMode { kind: "local", tokens } after setLocalAuth', () => {
    const tokenStore = new InMemoryTokenStore();
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(tokenStore) });

    act(() => {
      result.current.setLocalAuth(TOKENS);
    });

    expect(result.current.mode).toEqual({ kind: 'local', tokens: TOKENS });
  });

  it('clearAuth clears every TokenStore slot and resets mode to null', async () => {
    const tokenStore = new InMemoryTokenStore();
    await tokenStore.set({ kind: 'ha-access', token: 'a', expiresAt: Date.now() + 1000 });
    await tokenStore.set({ kind: 'ha-refresh', token: 'r' });
    await tokenStore.set({ kind: 'cloud-session', token: 'c', expiresAt: Date.now() + 1000 });

    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(tokenStore) });
    act(() => {
      result.current.setLocalAuth(TOKENS);
    });
    expect(result.current.mode).not.toBeNull();

    await act(async () => {
      await result.current.clearAuth();
    });

    expect(result.current.mode).toBeNull();
    expect(await tokenStore.get('ha-access')).toBeNull();
    expect(await tokenStore.get('ha-refresh')).toBeNull();
    expect(await tokenStore.get('cloud-session')).toBeNull();
  });

  it('throws when useAuth is called outside the provider', () => {
    function Probe() {
      useAuth();
      return null;
    }
    // React surfaces the throw via render(); silence the framework's console.error so the
    // assertion noise does not pollute test output.
    const originalError = console.error;
    console.error = () => {
      // intentional silence — see comment above.
    };
    try {
      expect(() => render(<Probe />)).toThrow(/useAuth/);
    } finally {
      console.error = originalError;
    }
  });
});
