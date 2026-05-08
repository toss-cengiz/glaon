import { useMemo, type ReactNode } from 'react';

import { AuthProvider, useAuth } from './auth/auth-provider';
import { CloudAuthProvider, getClerkPublishableKey } from './auth/cloud/clerk-provider';
import { useCloudSessionSync } from './auth/cloud/use-cloud-session';
import { deriveClientIdFromOrigin } from './auth/local-auth-flow';
import { WebTokenStore } from './auth/web-token-store';
import { AuthCallbackRoute } from './features/auth/local/auth-callback-route';
import { LoginRoute } from './features/auth/local/login-route';
import { SignInRoute } from './features/auth/cloud/sign-in-route';
import { SignUpRoute } from './features/auth/cloud/sign-up-route';

const HA_BASE_URL: string = import.meta.env.VITE_HA_BASE_URL ?? 'http://homeassistant.local:8123';
const LOGOUT_ENDPOINT = '/auth/logout';

export function App(): ReactNode {
  const tokenStore = useMemo(() => new WebTokenStore({ logoutEndpoint: LOGOUT_ENDPOINT }), []);
  const clerkKey = getClerkPublishableKey();

  // CloudAuthProvider only mounts when a publishable key is configured. The
  // Clerk SDK throws on import-time when given an empty key, so local-mode
  // builds without VITE_CLERK_PUBLISHABLE_KEY skip the provider entirely
  // (mode-detect #353 will narrow the scope further once it lands).
  const inner = (
    <AuthProvider tokenStore={tokenStore}>
      {clerkKey !== null ? <CloudSessionBridge /> : null}
      <Router clerkKey={clerkKey} />
    </AuthProvider>
  );

  if (clerkKey === null) return inner;
  return <CloudAuthProvider publishableKey={clerkKey}>{inner}</CloudAuthProvider>;
}

function CloudSessionBridge(): ReactNode {
  const { tokenStore } = useAuth();
  useCloudSessionSync(tokenStore);
  return null;
}

interface RouterProps {
  readonly clerkKey: string | null;
}

function Router({ clerkKey }: RouterProps): ReactNode {
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
  if (path === '/sign-in' || path === '/sign-up') {
    if (clerkKey === null) {
      return (
        <main data-testid="cloud-unavailable">
          <h1>Cloud sign-in unavailable</h1>
          <p>VITE_CLERK_PUBLISHABLE_KEY is not configured for this build.</p>
        </main>
      );
    }
    return path === '/sign-in' ? <SignInRoute /> : <SignUpRoute />;
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
