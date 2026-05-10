import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthProvider, useAuth } from './auth/auth-provider';
import { CloudAuthProvider, getClerkPublishableKey } from './auth/cloud/clerk-provider';
import { useCloudSessionSync } from './auth/cloud/use-cloud-session';
import { deriveClientIdFromOrigin } from './auth/local-auth-flow';
import { WebTokenStore } from './auth/web-token-store';
import { AuthCallbackRoute } from './features/auth/local/auth-callback-route';
import { LoginRoute } from './features/auth/local/login-route';
import { SignInRoute } from './features/auth/cloud/sign-in-route';
import { EmailVerificationPage } from './features/auth/email-verification/email-verification-page';
import { ForgotPasswordPage } from './features/auth/forgot-password/forgot-password-page';
import { SignUpPage } from './features/auth/sign-up/sign-up-page';
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
  const { t } = useTranslation();
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
  if (path === '/forgot-password') {
    if (clerkKey === null) {
      return (
        <main data-testid="cloud-unavailable">
          <h1>Password reset unavailable</h1>
          <p>VITE_CLERK_PUBLISHABLE_KEY is not configured for this build.</p>
        </main>
      );
    }
    return <ForgotPasswordPage />;
  }
  if (path === '/verify-email') {
    if (clerkKey === null) {
      return (
        <main data-testid="cloud-unavailable">
          <h1>Email verification unavailable</h1>
          <p>VITE_CLERK_PUBLISHABLE_KEY is not configured for this build.</p>
        </main>
      );
    }
    return <EmailVerificationPage />;
  }
  if (path === '/sign-in' || path === '/sign-up') {
    if (clerkKey === null) {
      return (
        <main data-testid="cloud-unavailable">
          <h1>{t('cloudUnavailable.signInTitle')}</h1>
          <p>{t('cloudUnavailable.body')}</p>
        </main>
      );
    }
    return path === '/sign-in' ? <SignInRoute /> : <SignUpPage />;
  }
  if (path === '/settings/link-to-cloud') {
    if (clerkKey === null) {
      return (
        <main data-testid="cloud-unavailable">
          <h1>{t('cloudUnavailable.pairingTitle')}</h1>
          <p>{t('cloudUnavailable.body')}</p>
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
            <h1>{t('cloudUnavailable.signInTitle')}</h1>
            <p>{t('cloudUnavailable.body')}</p>
            <button type="button" onClick={() => void switchMode()}>
              {t('cloudUnavailable.pickDifferentMode')}
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
        <h1>{t('app.name')}</h1>
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
          {t('shell.switchMode')}
        </button>
      </header>
      <p>{t('shell.signedInPlaceholder')}</p>
    </main>
  );
}
