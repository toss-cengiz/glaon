// ForgotPasswordPage — 4-step Glaon-rendered password reset flow
// (#472, #531). Drives Clerk's `reset_password_email_code` strategy
// via `useForgotPassword`. Renders the centered AuthLayout with a
// per-step icon, title, and subtitle.
//
//   step 1 (email)        — `Key01` icon, "Forgot password?"
//   step 2 (check-email)  — `Mail01` icon, "Check your email"
//   step 3 (reset)        — `Lock01` icon, "Set new password"
//   step 4 (success)      — `CheckCircle` icon, "Password reset"
//
// On success the page navigates to `/login` after a 2s delay (or the
// user can click "Sign in" immediately).
//
// Errors route through the central Toast (#519) for the `unknown`
// fallback only. Field-level errors (`form_code_incorrect`,
// `form_param_format_invalid` etc.) render inline on the matching
// `<Input>` / `<VerificationCodeInput>` / `<PasswordInput>` per the
// Toast Rule's per-field validation exception.

import { useEffect, useState, type ReactNode, type SyntheticEvent } from 'react';

import {
  AuthFooter,
  AuthLayout,
  Button,
  Input,
  PasswordInput,
  VerificationCodeInput,
  useToast,
} from '@glaon/ui';

import { useForgotPassword } from './use-forgot-password';

const SUCCESS_AUTOREDIRECT_MS = 2000;

interface ForgotPasswordPageProps {
  navigate?: ((url: string) => void) | undefined;
}

interface ForgotErrorState {
  readonly code: string;
  readonly message: string;
}

interface ToastCopy {
  readonly title: string;
  readonly description?: string;
}

// Toast copy only fires for the `unknown` code — every other code is
// owned by a specific field below and renders inline. Per the Toast
// Rule (CLAUDE.md), the generic-fallback constant is reserved for
// `unknown`.
const FORGOT_UNKNOWN_COPY: ToastCopy = {
  title: 'Password reset failed',
  description: 'Something went wrong with Glaon Cloud. Try again in a moment.',
};

// Inline SVG icons keyed off the step. Using inline SVG avoids the
// `@untitledui/icons` dependency leaking into apps/web (only @glaon/ui
// imports the kit's icon set).
const ICON_PATHS = {
  key: 'M16.5 9.5a4.5 4.5 0 1 1-4.95-4.477A4.5 4.5 0 0 1 16.5 9.5Zm-4.5 4.5l5 5m-1-1 2 2m-2-4 2 2',
  mail: 'm3 7 8.165 5.71a1.5 1.5 0 0 0 1.67 0L21 7M5 18h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z',
  lock: 'M16 11V7a4 4 0 1 0-8 0v4M5 11h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z',
  check: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
} as const;

function FeaturedIcon({ name }: { name: keyof typeof ICON_PATHS }): ReactNode {
  return (
    <div className="flex size-14 items-center justify-center rounded-xl ring-1 ring-primary">
      <svg
        className="size-7 text-secondary"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={ICON_PATHS[name]} />
      </svg>
    </div>
  );
}

export function ForgotPasswordPage({ navigate }: ForgotPasswordPageProps): ReactNode {
  const { state, requestReset, resendCode, goToReset, resetPassword, isLoaded } =
    useForgotPassword();
  const toast = useToast();

  useEffect(() => {
    if (state.step !== 'success') return;
    const go =
      navigate ??
      ((url: string) => {
        window.location.assign(url);
      });
    const timer = setTimeout(() => {
      go('/login');
    }, SUCCESS_AUTOREDIRECT_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [navigate, state.step]);

  // Surface the `unknown`-code fallback through Toast. Field-level
  // errors (every other code) render inline on the owning input and
  // never reach the toast.
  useEffect(() => {
    if (state.error !== null && state.error.code === 'unknown') {
      toast.show({ intent: 'danger', ...FORGOT_UNKNOWN_COPY });
    }
  }, [state.error, toast]);

  const goToLogin = () => {
    const go =
      navigate ??
      ((url: string) => {
        window.location.assign(url);
      });
    go('/login');
  };

  if (state.step === 'email') {
    return (
      <AuthLayout
        variant="centered"
        iconSlot={<FeaturedIcon name="key" />}
        title="Forgot password?"
        subtitle="No worries, we'll send you reset instructions."
      >
        <EmailStep
          isLoaded={isLoaded}
          isSubmitting={state.status === 'submitting'}
          error={state.error}
          onSubmit={(email) => {
            void requestReset(email);
          }}
        />
        <AuthFooter linkText="Back to log in" linkHref="/login" iconLeading="arrow-left" />
      </AuthLayout>
    );
  }

  if (state.step === 'check-email') {
    return (
      <AuthLayout
        variant="centered"
        iconSlot={<FeaturedIcon name="mail" />}
        title="Check your email"
        subtitle={`We sent a password reset link to ${state.email}.`}
      >
        <div className="flex w-full flex-col gap-3">
          <Button size="lg" onClick={goToReset}>
            Enter reset code
          </Button>
          <Button
            size="lg"
            color="secondary"
            isLoading={state.status === 'submitting'}
            onClick={() => {
              void resendCode();
            }}
          >
            Resend email
          </Button>
        </div>
        <AuthFooter linkText="Back to log in" linkHref="/login" iconLeading="arrow-left" />
      </AuthLayout>
    );
  }

  if (state.step === 'reset') {
    return (
      <AuthLayout
        variant="centered"
        iconSlot={<FeaturedIcon name="lock" />}
        title="Set new password"
        subtitle={`Enter the code we sent to ${state.email}.`}
      >
        <ResetStep
          isLoaded={isLoaded}
          isSubmitting={state.status === 'submitting'}
          error={state.error}
          onSubmit={(input) => {
            void resetPassword(input);
          }}
        />
        <AuthFooter linkText="Back to log in" linkHref="/login" iconLeading="arrow-left" />
      </AuthLayout>
    );
  }

  // success
  return (
    <AuthLayout
      variant="centered"
      iconSlot={<FeaturedIcon name="check" />}
      title="Password reset"
      subtitle="Your password has been updated. Sign in to continue."
    >
      <Button size="lg" onClick={goToLogin}>
        Sign in
      </Button>
    </AuthLayout>
  );
}

// Codes that belong to the email field; anything else here is either
// a field error owned by ResetStep or the `unknown` fallback that
// fires through Toast at the parent level.
const EMAIL_FIELD_CODES = new Set(['form_param_format_invalid', 'form_identifier_not_found']);

function EmailStep({
  isLoaded,
  isSubmitting,
  error,
  onSubmit,
}: {
  isLoaded: boolean;
  isSubmitting: boolean;
  error: ForgotErrorState | null;
  onSubmit: (email: string) => void;
}): ReactNode {
  const [email, setEmail] = useState('');
  const emailError =
    error !== null && EMAIL_FIELD_CODES.has(error.code) ? error.message : undefined;
  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(email);
  };
  return (
    <form
      data-testid="forgot-email-form"
      onSubmit={submit}
      className="flex w-full flex-col gap-4"
      noValidate
    >
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        isRequired
        value={email}
        onChange={setEmail}
        placeholder="Enter your email"
        isInvalid={emailError !== undefined}
        {...(emailError !== undefined ? { hint: emailError } : {})}
      />
      <Button type="submit" size="lg" isLoading={isSubmitting} isDisabled={!isLoaded}>
        Reset password
      </Button>
    </form>
  );
}

// Code-field codes — VerificationCodeInput owns them.
const CODE_FIELD_CODES = new Set(['form_code_incorrect', 'form_code_expired']);
// Password-field codes — the new-password `<PasswordInput>` owns them.
// `form_param_format_invalid` here is the hook's "passwords don't
// match" / "too short" client-side validation in `resetPassword`.
const PASSWORD_FIELD_CODES = new Set(['form_param_format_invalid', 'form_password_pwned']);

function ResetStep({
  isLoaded,
  isSubmitting,
  error,
  onSubmit,
}: {
  isLoaded: boolean;
  isSubmitting: boolean;
  error: ForgotErrorState | null;
  onSubmit: (input: { code: string; password: string; confirmPassword: string }) => void;
}): ReactNode {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const codeError = error !== null && CODE_FIELD_CODES.has(error.code) ? error.message : undefined;
  const passwordError =
    error !== null && PASSWORD_FIELD_CODES.has(error.code) ? error.message : undefined;
  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ code, password, confirmPassword });
  };
  return (
    <form
      data-testid="forgot-reset-form"
      onSubmit={submit}
      className="flex w-full flex-col gap-4"
      noValidate
    >
      <VerificationCodeInput
        label="Reset code"
        digits={6}
        value={code}
        onChange={setCode}
        ariaLabel="Reset code"
        {...(codeError !== undefined ? { isInvalid: true, hint: codeError } : {})}
      />
      <PasswordInput
        label="New password"
        autoComplete="new-password"
        hint={passwordError ?? 'Must be at least 8 characters.'}
        {...(passwordError !== undefined ? { error: passwordError } : {})}
        value={password}
        onChange={setPassword}
        isRequired
      />
      <PasswordInput
        label="Confirm password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        isRequired
      />
      <Button type="submit" size="lg" isLoading={isSubmitting} isDisabled={!isLoaded}>
        Reset password
      </Button>
    </form>
  );
}
