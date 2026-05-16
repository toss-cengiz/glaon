import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import loginHeroUrl from './assets/auth/login-hero.jpg';
import { AuthProvider, useAuth } from './auth/auth-provider';
import { CloudAuthProvider, getClerkPublishableKey } from './auth/cloud/clerk-provider';
import { useCloudSessionSync } from './auth/cloud/use-cloud-session';
import { deriveClientIdFromOrigin } from './auth/local-auth-flow';
import { WebTokenStore } from './auth/web-token-store';
import { AuthCallbackRoute } from './features/auth/local/auth-callback-route';
import { EmailVerificationPage } from './features/auth/email-verification/email-verification-page';
import { ForgotPasswordPage } from './features/auth/forgot-password/forgot-password-page';
import { LoginPage } from './features/auth/login/login-page';
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

// Lifestyle hero shipped from Figma node 1267:132204 (#514, closes
// #513). JPEG at quality ~80 — 290KB — stays within the apps/web
// bundle budget #500 is tightening. The image is purely decorative
// (the AuthLayout marks its own `<aside>` aria-hidden), so alt="".
const LOGIN_HERO_IMAGE = (
  <img src={loginHeroUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
);

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
  if (path === '/login' || path === '/sign-in') {
    // `/sign-in` was the legacy Clerk-hosted path; both URLs now land
    // on the unified LoginPage with the Cloud tab pre-selected for
    // `/sign-in` so old bookmarks keep working.
    const params = new URLSearchParams(window.location.search);
    const queryTab = params.get('tab');
    const defaultTab: 'device' | 'cloud' =
      path === '/sign-in' || queryTab === 'cloud' ? 'cloud' : 'device';
    return (
      <LoginPage
        defaultTab={defaultTab}
        defaultHaBaseUrl={HA_BASE_URL}
        cloudAvailable={clerkKey !== null}
        imageSlot={LOGIN_HERO_IMAGE}
      />
    );
  }
  if (path === '/sign-up') {
    if (clerkKey === null) {
      return (
        <main data-testid="cloud-unavailable">
          <h1>{t('cloudUnavailable.signInTitle')}</h1>
          <p>{t('cloudUnavailable.body')}</p>
        </main>
      );
    }
    return <SignUpPage />;
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
    // Per #470 the dedicated `<SignInRoute>` for cloud preference is
    // gone; LoginPage handles both modes via its tab toggle. The
    // cloud-unavailable copy is rendered inline by LoginPage's Cloud
    // tab when the publishable key is missing.
    const localBaseUrl = preference.lastLocalUrl ?? config.baseUrl;
    const defaultTab: 'device' | 'cloud' = preference.mode === 'cloud' ? 'cloud' : 'device';
    return (
      <LoginPage
        defaultTab={defaultTab}
        defaultHaBaseUrl={localBaseUrl}
        cloudAvailable={clerkKey !== null}
        imageSlot={LOGIN_HERO_IMAGE}
      />
    );
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
