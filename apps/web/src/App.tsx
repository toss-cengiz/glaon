import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { AuthProvider, useAuth } from './auth/auth-provider';
import { CloudAuthProvider, getClerkPublishableKey } from './auth/cloud/clerk-provider';
import { useCloudSessionSync } from './auth/cloud/use-cloud-session';
import { deriveClientIdFromOrigin } from './auth/local-auth-flow';
import { WebTokenStore } from './auth/web-token-store';
import { AuthCallbackRoute } from './features/auth/local/auth-callback-route';
import { LoginRoute } from './features/auth/local/login-route';
import { SignInRoute } from './features/auth/cloud/sign-in-route';
import { SignUpRoute } from './features/auth/cloud/sign-up-route';
import { PairWizardRoute } from './features/cloud-pairing/pair-wizard-route';
import { ModeSelectRoute } from './features/mode-select/mode-select-route';
import {
  clearModePreference,
  readModePreference,
  writeModePreference,
  type ModePreference,
} from './features/mode-select/mode-preference';

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
  const { mode, clearAuth } = useAuth();
  const path = window.location.pathname;
  const config = useMemo(
    () => ({
      baseUrl: HA_BASE_URL,
      clientId: deriveClientIdFromOrigin(window.location.origin),
    }),
    [],
  );
  const redirectUri = `${window.location.origin}/auth/callback`;

  // Mode preference is the gate before mounting either auth tree. It's a
  // ReactState mirror of localStorage so a click on a card reflects without
  // a reload; clicking "Switch mode" wipes the preference + auth state.
  const [preference, setPreference] = useState<ModePreference | null>(() => readModePreference());
  const choosePreference = useCallback((next: ModePreference) => {
    setPreference(next);
  }, []);
  const switchMode = useCallback(async () => {
    clearModePreference();
    await clearAuth();
    setPreference(null);
  }, [clearAuth]);

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
  if (path === '/settings/link-to-cloud') {
    if (clerkKey === null) {
      return (
        <main data-testid="cloud-unavailable">
          <h1>Cloud pairing unavailable</h1>
          <p>VITE_CLERK_PUBLISHABLE_KEY is not configured for this build.</p>
        </main>
      );
    }
    return (
      <PairWizardRoute
        onCloudReady={() => {
          // Promote: persist cloud preference, drop local auth so the
          // mode-selector flips to cloud on the next reload.
          writeModePreference({ mode: 'cloud' });
          void clearAuth();
          window.location.assign('/');
        }}
      />
    );
  }
  if (mode === null) {
    if (preference === null) {
      return <ModeSelectRoute cloudAvailable={clerkKey !== null} onChoose={choosePreference} />;
    }
    if (preference.mode === 'cloud') {
      if (clerkKey === null) {
        return (
          <main data-testid="cloud-unavailable">
            <h1>Cloud sign-in unavailable</h1>
            <p>VITE_CLERK_PUBLISHABLE_KEY is not configured for this build.</p>
            <button type="button" onClick={() => void switchMode()}>
              Pick a different mode
            </button>
          </main>
        );
      }
      return <SignInRoute />;
    }
    const localBaseUrl = preference.lastLocalUrl ?? config.baseUrl;
    return <LoginRoute config={{ ...config, baseUrl: localBaseUrl }} redirectUri={redirectUri} />;
  }
  return (
    <main>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1>Glaon</h1>
        <button
          type="button"
          data-testid="switch-mode"
          onClick={() => void switchMode()}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: '1px solid #d0d7de',
            background: 'white',
            cursor: 'pointer',
            font: 'inherit',
          }}
        >
          Switch mode
        </button>
      </header>
      <p>Signed in. The Phase 2 dashboard lands once #10–#12 wire the HA WebSocket.</p>
    </main>
  );
}
