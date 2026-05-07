// Mobile counterpart of the web AuthProvider — see apps/web/src/auth/auth-provider.tsx.
// Same surface (mode + tokenStore + setLocalAuth + clearAuth) so feature code is
// platform-agnostic at the call site.

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

  const cancelledRef = useRef(false);
  useEffect(() => {
    cancelledRef.current = false;
    void (async () => {
      const access = await tokenStore.get('ha-access');
      if (cancelledRef.current || access === null) return;
      const refresh = await tokenStore.get('ha-refresh');
      // cancelledRef.current may have been set to true by the cleanup function while the
      // awaited tokenStore.get was in flight; lint cannot model that mutation here.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (cancelledRef.current) return;
      const synthetic: AuthMode = {
        kind: 'local',
        tokens: {
          access_token: access.token,
          refresh_token: refresh?.token ?? '',
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
