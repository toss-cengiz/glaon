// LoginPage — single screen for both Cloud (Clerk headless) and
// Device (HA login_flow proxy) sign-in (#470). Replaces the legacy
// `<LoginRoute>` (local-mode HA OAuth redirect) and `<SignInRoute>`
// (Clerk hosted view). Both legacy paths are removed in App.tsx.
//
// Tabs:
//   - Cloud: email + password + Google + Apple. Calls Clerk's
//     headless `useSignIn()`; the `useCloudSessionSync` hook in
//     App.tsx mirrors the Clerk session into the cloud-session slot.
//   - Device: HA URL + username + password. Calls
//     `apiClient.haPasswordGrant(...)` which proxies to HA's
//     `/auth/login_flow` (ADR 0027). On success the hook writes the
//     HA tokens into the local-mode slot group and dispatches
//     `setLocalAuth(...)` so the rest of the app reads `mode='local'`.
//
// MFA on the Device tab — HA `login_flow` returns a follow-up form
// step for 2FA users. We surface the dedicated `mfa-required` message
// so the user knows to fall back to HA's own UI for now (Phase 2.5
// will add MFA support — see issue body for the follow-up).

import { useEffect, useState, type ReactNode, type SyntheticEvent } from 'react';

import {
  AuthFooter,
  AuthLayout,
  Button,
  FormField,
  PasswordInput,
  SocialButton,
  Tabs,
  useFormFieldDescriptors,
} from '@glaon/ui';

import { useAuth } from '../../../auth/auth-provider';
import { deriveClientIdFromOrigin } from '../../../auth/local-auth-flow';
import { useCloudSignIn } from './use-cloud-sign-in';
import { useDeviceSignIn } from './use-device-sign-in';

type LoginTab = 'device' | 'cloud';

interface LoginPageProps {
  /**
   * Initial tab — typically derived from the mode-select preference
   * or from a `?tab=cloud` query parameter.
   * @default 'device'
   */
  defaultTab?: LoginTab;
  /**
   * Default Home Assistant base URL surfaced in the Device tab. The
   * field is editable so households running on a non-default port or
   * domain can override it before pressing Sign in.
   */
  defaultHaBaseUrl: string;
  /**
   * Whether Cloud sign-in is configured (i.e. Clerk publishable key
   * is set). When `false` the Cloud tab renders an explanatory note
   * instead of the form so we don't crash the Clerk SDK at runtime.
   */
  cloudAvailable: boolean;
  /**
   * Hero image rendered in the right column (split layout). Pass
   * `null` to render the form full-width on every breakpoint — used
   * by tests to keep the layout deterministic.
   */
  imageSlot?: ReactNode;
  /**
   * Navigation injection — defaults to `window.location.assign`. Lets
   * tests assert "after-success" navigation without leaving jsdom.
   */
  navigate?: ((url: string) => void) | undefined;
}

export function LoginPage({
  defaultTab = 'device',
  defaultHaBaseUrl,
  cloudAvailable,
  imageSlot,
  navigate,
}: LoginPageProps): ReactNode {
  const [activeTab, setActiveTab] = useState<LoginTab>(defaultTab);

  return (
    <AuthLayout
      variant="split"
      imageSlot={imageSlot}
      footerSlot={<span>© Glaon {new Date().getFullYear().toString()}</span>}
    >
      <header className="flex flex-col gap-2">
        <h1 className="text-display-sm font-semibold text-primary">Welcome back</h1>
        <p className="text-md text-tertiary">Welcome back! Please enter your details.</p>
      </header>

      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => {
          setActiveTab(key as LoginTab);
        }}
      >
        <Tabs.List aria-label="Sign-in mode">
          <Tabs.Trigger id="device" label="Device" />
          <Tabs.Trigger id="cloud" label="Cloud" />
        </Tabs.List>

        <Tabs.Content id="device">
          <DeviceTab defaultHaBaseUrl={defaultHaBaseUrl} navigate={navigate} />
        </Tabs.Content>
        <Tabs.Content id="cloud">
          {cloudAvailable ? (
            <CloudTab navigate={navigate} />
          ) : (
            <p className="text-sm text-tertiary" data-testid="cloud-unavailable-inline">
              Cloud sign-in isn&apos;t available in this build. Use the Device tab to connect to a
              local Home Assistant.
            </p>
          )}
        </Tabs.Content>
      </Tabs>
    </AuthLayout>
  );
}

interface DeviceTabProps {
  readonly defaultHaBaseUrl: string;
  readonly navigate?: ((url: string) => void) | undefined;
}

function DeviceTab({ defaultHaBaseUrl, navigate }: DeviceTabProps): ReactNode {
  const [haBaseUrl, setHaBaseUrl] = useState<string>(defaultHaBaseUrl);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { state, submit } = useDeviceSignIn();
  const haUrlField = useFormFieldDescriptors('login-ha-url');

  useEffect(() => {
    if (state.status === 'success') {
      const go =
        navigate ??
        ((url: string) => {
          window.location.assign(url);
        });
      go('/');
    }
  }, [navigate, state]);

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit({
      haBaseUrl,
      username,
      password,
      clientId: deriveClientIdFromOrigin(window.location.origin),
    });
  };

  const isSubmitting = state.status === 'submitting';
  const error = state.status === 'error' ? state.error : null;

  return (
    <form
      data-testid="login-device-form"
      onSubmit={onSubmit}
      className="flex flex-col gap-4 pt-4"
      noValidate
    >
      <FormField
        label="Home Assistant URL"
        htmlFor="login-ha-url"
        hint="Enter the URL of your Home Assistant install."
        isRequired
      >
        <input
          id="login-ha-url"
          name="haBaseUrl"
          type="url"
          required
          value={haBaseUrl}
          onChange={(e) => {
            setHaBaseUrl(e.currentTarget.value);
          }}
          aria-describedby={haUrlField.describedBy(false, true)}
          className="w-full rounded-lg bg-primary px-3 py-2 text-md text-primary shadow-xs ring-1 ring-primary ring-inset focus:outline-hidden focus:ring-2 focus:ring-brand"
          placeholder="http://homeassistant.local:8123"
        />
      </FormField>

      <FormField label="Username" htmlFor="login-device-username" isRequired>
        <input
          id="login-device-username"
          name="username"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => {
            setUsername(e.currentTarget.value);
          }}
          className="w-full rounded-lg bg-primary px-3 py-2 text-md text-primary shadow-xs ring-1 ring-primary ring-inset focus:outline-hidden focus:ring-2 focus:ring-brand"
          placeholder="Username"
        />
      </FormField>

      <PasswordInput
        label="Password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
        isRequired
      />

      {error !== null && (
        <p role="alert" data-testid="login-device-error" className="text-sm text-error">
          {error.message}
        </p>
      )}

      <Button type="submit" size="lg" isLoading={isSubmitting}>
        Sign in
      </Button>
    </form>
  );
}

interface CloudTabProps {
  readonly navigate?: ((url: string) => void) | undefined;
}

function CloudTab({ navigate }: CloudTabProps): ReactNode {
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { state, submit, signInWithSocial, isLoaded } = useCloudSignIn();
  const { mode } = useAuth();

  useEffect(() => {
    if (state.status === 'success' || (state.status === 'idle' && mode?.kind === 'cloud')) {
      const go =
        navigate ??
        ((url: string) => {
          window.location.assign(url);
        });
      go('/');
    }
  }, [mode, navigate, state]);

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit({ identifier, password });
  };

  const isSubmitting = state.status === 'submitting';
  const error = state.status === 'error' ? state.error : null;

  return (
    <form
      data-testid="login-cloud-form"
      onSubmit={onSubmit}
      className="flex flex-col gap-4 pt-4"
      noValidate
    >
      <FormField label="Email" htmlFor="login-cloud-email" isRequired>
        <input
          id="login-cloud-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.currentTarget.value);
          }}
          className="w-full rounded-lg bg-primary px-3 py-2 text-md text-primary shadow-xs ring-1 ring-primary ring-inset focus:outline-hidden focus:ring-2 focus:ring-brand"
          placeholder="Enter your email"
        />
      </FormField>

      <PasswordInput
        label="Password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
        isRequired
      />

      <div className="flex items-center justify-end">
        <a
          href="/forgot-password"
          className="text-sm font-semibold text-brand_secondary hover:text-brand"
        >
          Forgot password
        </a>
      </div>

      {error !== null && (
        <p role="alert" data-testid="login-cloud-error" className="text-sm text-error">
          {error.message}
        </p>
      )}

      <Button type="submit" size="lg" isLoading={isSubmitting} isDisabled={!isLoaded}>
        Sign in
      </Button>

      <SocialButton
        brand="google"
        onPress={() => {
          void signInWithSocial('oauth_google');
        }}
      >
        Sign in with Google
      </SocialButton>
      <SocialButton
        brand="apple"
        onPress={() => {
          void signInWithSocial('oauth_apple');
        }}
      >
        Sign in with Apple
      </SocialButton>

      <AuthFooter prompt="Don't have an account?" linkText="Sign up" linkHref="/sign-up" />
    </form>
  );
}
