import { useMemo, type ReactNode } from 'react';

import { AuthProvider, useAuth } from './auth/auth-provider';
import { deriveClientIdFromOrigin } from './auth/local-auth-flow';
import { WebTokenStore } from './auth/web-token-store';
import { AuthCallbackRoute } from './features/auth/local/auth-callback-route';
import { LoginRoute } from './features/auth/local/login-route';

const HA_BASE_URL: string = import.meta.env.VITE_HA_BASE_URL;
const LOGOUT_ENDPOINT = '/auth/logout';

export function App(): ReactNode {
  const tokenStore = useMemo(() => new WebTokenStore({ logoutEndpoint: LOGOUT_ENDPOINT }), []);

  return (
    <AuthProvider tokenStore={tokenStore}>
      <Router />
    </AuthProvider>
  );
}

function Router(): ReactNode {
  const { mode } = useAuth();
  const path = window.location.pathname;
  const config = useMemo(
    () => ({
      baseUrl: HA_BASE_URL,
      clientId: deriveClientIdFromOrigin(window.location.origin),
    }),
    [],
  );
  const redirectUri = `${window.location.origin}/auth/callback`;

  if (path === '/auth/callback') {
    return (
      <AuthCallbackRoute
        config={config}
        redirectUri={redirectUri}
        onSuccess={() => {
          window.location.assign('/');
        }}
      />
    );
  }
  if (mode === null) {
    return <LoginRoute config={config} redirectUri={redirectUri} />;
  }
  return (
    <main>
      <h1>Glaon</h1>
      <p>Signed in. The Phase 2 dashboard lands once #10–#12 wire the HA WebSocket.</p>
    </main>
  );
}
