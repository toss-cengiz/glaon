// AuthProvider: surfaces the dual-mode AuthMode union (ADR 0017) to the rest of the web app.
// Wraps a TokenStore + RefreshMutex; consumers read AuthMode via `useAuth()` and dispatch
// login / logout side effects via the action callbacks.
//
// This is the only place where TokenStore + AuthMode are wired together — feature pages
// import `useAuth` and never instantiate stores directly.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { RefreshMutex, type AuthMode, type HaAuthTokens, type TokenStore } from '@glaon/core/auth';

interface AuthContextValue {
  readonly mode: AuthMode | null;
  readonly tokenStore: TokenStore;
  readonly refreshMutex: RefreshMutex;
  readonly setLocalAuth: (tokens: HaAuthTokens) => void;
  readonly clearAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  readonly tokenStore: TokenStore;
  readonly initialMode?: AuthMode | null;
  readonly children: ReactNode;
}

export function AuthProvider({
  tokenStore,
  initialMode = null,
  children,
}: AuthProviderProps): ReactNode {
  const [mode, setMode] = useState<AuthMode | null>(initialMode);
  const refreshMutex = useMemo(() => new RefreshMutex(), []);

  // On mount, hydrate AuthMode from the access slot if a token is already in memory
  // (helps unit-test scenarios; production callers will set the mode explicitly via
  // setLocalAuth after a successful OAuth callback).
  const cancelledRef = useRef(false);
  useEffect(() => {
    cancelledRef.current = false;
    void (async () => {
      const access = await tokenStore.get('ha-access');
      if (cancelledRef.current || access === null) return;
      // We don't have the original HaAuthTokens shape here — just the in-memory slot.
      // Until #10 wires the HA WS client and consumes AuthMode, the in-memory hydration
      // is enough to mark the user as authenticated.
      const synthetic: AuthMode = {
        kind: 'local',
        tokens: {
          access_token: access.token,
          refresh_token: '',
          expires_in: Math.max(0, Math.floor((access.expiresAt - Date.now()) / 1000)),
          issued_at: Date.now(),
          token_type: 'Bearer',
        },
      };
      setMode(synthetic);
    })();
    return () => {
      cancelledRef.current = true;
    };
  }, [tokenStore]);

  const value = useMemo<AuthContextValue>(
    () => ({
      mode,
      tokenStore,
      refreshMutex,
      setLocalAuth: (tokens) => {
        setMode({ kind: 'local', tokens });
      },
      clearAuth: async () => {
        await tokenStore.clear();
        setMode(null);
      },
    }),
    [mode, tokenStore, refreshMutex],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
