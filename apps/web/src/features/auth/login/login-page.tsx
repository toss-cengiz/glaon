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
//
// Figma reference: Design-System / Log in / node 1267:132397
// (Desktop/Mobile × Cloud/Device variants). Fidelity gaps tracked
// in #501 — three raw `<input>` call sites swapped to `<Input>`,
// "Remember for 30 days" Checkbox added on both tabs, explicit
// `<Logo size="lg">` so the brand-mark accent reads at the layout's
// `lg:max-w-[720px]` form column.

import { useEffect, useState, type ReactNode, type SyntheticEvent } from 'react';

import {
  AuthFooter,
  AuthLayout,
  Button,
  Checkbox,
  Input,
  Logo,
  PasswordInput,
  SocialButton,
  Tabs,
  useToast,
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
      logoSlot={<Logo size={133} />}
      imageSlot={imageSlot}
      footerSlot={<span>© Glaon {new Date().getFullYear().toString()}</span>}
    >
      <header className="flex flex-col gap-3">
        <h1 className="text-display-xs font-semibold text-primary">Welcome back</h1>
        <p className="text-md text-tertiary">Welcome back! Please enter your details.</p>
      </header>

      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => {
          setActiveTab(key as LoginTab);
        }}
      >
        <Tabs.List aria-label="Sign-in mode" type="button-border" fullWidth>
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

// Per the API Error Toast Rule (CLAUDE.md), every error code that
// reaches the UI maps to specific copy here — generic fallback is
// reserved for `unknown` only. Mirrors `DeviceSignInErrorCode` from
// `use-device-sign-in.ts`. The fallback constant stays separate so the
// `?? UNKNOWN` lookup is type-safe under `noUncheckedIndexedAccess`.
interface ToastCopy {
  readonly title: string;
  readonly description?: string;
}

const DEVICE_UNKNOWN_COPY: ToastCopy = {
  title: 'Sign-in failed',
  description: 'Something went wrong. Try again, or check the browser console for details.',
};

const DEVICE_ERROR_COPY: Record<string, ToastCopy> = {
  'invalid-url': {
    title: 'Invalid Home Assistant URL',
    description: 'Enter the full URL of your install (e.g. http://homeassistant.local:8123).',
  },
  'invalid-credentials': {
    title: 'Wrong username or password',
    description: 'Double-check your Home Assistant credentials and try again.',
  },
  'mfa-required': {
    title: 'Multi-factor authentication required',
    description:
      'Two-factor sign-in via Glaon is not supported yet. Sign in directly through Home Assistant for now.',
  },
  unreachable: {
    title: 'Couldn’t reach the Glaon addon',
    description: 'Make sure the Glaon addon is running and reachable, then try again.',
  },
  'flow-error': {
    title: 'Home Assistant rejected the sign-in',
    description: 'Home Assistant returned an unexpected response. Try again in a moment.',
  },
  unknown: DEVICE_UNKNOWN_COPY,
};

function DeviceTab({ defaultHaBaseUrl, navigate }: DeviceTabProps): ReactNode {
  const [haBaseUrl, setHaBaseUrl] = useState<string>(defaultHaBaseUrl);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  // `rememberMe` is captured for Figma parity (#501) but does not yet
  // flow to the backend — the HA password-grant proxy uses a fixed
  // refresh window today. Wire-through is tracked as a follow-up.
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const { state, submit } = useDeviceSignIn();
  const toast = useToast();

  useEffect(() => {
    if (state.status === 'success') {
      const go =
        navigate ??
        ((url: string) => {
          window.location.assign(url);
        });
      go('/');
    }
    if (state.status === 'error') {
      const copy = DEVICE_ERROR_COPY[state.error.code] ?? DEVICE_UNKNOWN_COPY;
      toast.show({ intent: 'danger', ...copy });
    }
  }, [navigate, state, toast]);

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    void rememberMe; // UI-only this PR; see comment above.
    void submit({
      haBaseUrl,
      username,
      password,
      clientId: deriveClientIdFromOrigin(window.location.origin),
    });
  };

  const isSubmitting = state.status === 'submitting';

  return (
    <form
      data-testid="login-device-form"
      onSubmit={onSubmit}
      className="flex flex-col gap-4 pt-4"
      noValidate
    >
      <Input
        label="Home Assistant URL"
        hint="Enter the URL of your Home Assistant install."
        name="haBaseUrl"
        type="url"
        isRequired
        value={haBaseUrl}
        onChange={setHaBaseUrl}
        placeholder="http://homeassistant.local:8123"
      />

      <Input
        label="Username"
        name="username"
        type="text"
        autoComplete="username"
        isRequired
        value={username}
        onChange={setUsername}
        placeholder="Username"
      />

      <PasswordInput
        label="Password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
        isRequired
      />

      <Checkbox
        label="Remember for 30 days"
        isSelected={rememberMe}
        onChange={setRememberMe}
        size="sm"
      />

      <Button type="submit" size="lg" isLoading={isSubmitting}>
        Sign in
      </Button>
    </form>
  );
}

interface CloudTabProps {
  readonly navigate?: ((url: string) => void) | undefined;
}

// Mirrors `CloudSignInErrorCode` from `use-cloud-sign-in.ts`. Clerk
// error codes use snake_case; copy stays user-facing English. Same
// type-safe fallback pattern as the device copy table above.
const CLOUD_UNKNOWN_COPY: ToastCopy = {
  title: 'Sign-in failed',
  description: 'Something went wrong with Glaon Cloud. Try again in a moment.',
};

const CLOUD_ERROR_COPY: Record<string, ToastCopy> = {
  form_param_format_invalid: {
    title: 'Check your email address',
    description: 'That doesn’t look like a valid email — try again.',
  },
  form_password_incorrect: {
    title: 'Wrong password',
    description: 'Double-check your password and try again, or use Forgot password.',
  },
  form_identifier_not_found: {
    title: 'No account with that email',
    description: 'Make sure you signed up with this address, or create a new account.',
  },
  session_exists: {
    title: 'Already signed in',
    description: 'A Glaon Cloud session is already active. Refresh to continue.',
  },
  unknown: CLOUD_UNKNOWN_COPY,
};

function CloudTab({ navigate }: CloudTabProps): ReactNode {
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  // `rememberMe` is captured for Figma parity (#501) but does not yet
  // flow to Clerk — `signIn.create` doesn't surface a session-lifetime
  // knob in the headless API today.
  const [cloudRememberMe, setCloudRememberMe] = useState<boolean>(false);
  const { state, submit, signInWithSocial, isLoaded } = useCloudSignIn();
  const { mode } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (state.status === 'success' || (state.status === 'idle' && mode?.kind === 'cloud')) {
      const go =
        navigate ??
        ((url: string) => {
          window.location.assign(url);
        });
      go('/');
    }
    if (state.status === 'error') {
      const copy = CLOUD_ERROR_COPY[state.error.code] ?? CLOUD_UNKNOWN_COPY;
      toast.show({ intent: 'danger', ...copy });
    }
  }, [mode, navigate, state, toast]);

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    void cloudRememberMe; // UI-only this PR; see comment above.
    void submit({ identifier, password });
  };

  const isSubmitting = state.status === 'submitting';

  return (
    <form
      data-testid="login-cloud-form"
      onSubmit={onSubmit}
      className="flex flex-col gap-4 pt-4"
      noValidate
    >
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        isRequired
        value={identifier}
        onChange={setIdentifier}
        placeholder="Enter your email"
      />

      <PasswordInput
        label="Password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
        isRequired
      />

      <div className="flex items-center justify-between">
        <Checkbox
          label="Remember for 30 days"
          isSelected={cloudRememberMe}
          onChange={setCloudRememberMe}
          size="sm"
        />
        <a
          href="/forgot-password"
          className="text-sm font-semibold text-brand_secondary hover:text-brand"
        >
          Forgot password
        </a>
      </div>

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
