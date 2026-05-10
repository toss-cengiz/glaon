// ForgotPasswordPage — 4-step Glaon-rendered password reset flow
// (#472). Drives Clerk's `reset_password_email_code` strategy via
// `useForgotPassword`. Renders the Figma centered-card layout with
// per-step icon slot:
//
//   step 1 (email)        — `Key01` icon, "Forgot password?"
//   step 2 (check-email)  — `Mail01` icon, "Check your email"
//   step 3 (reset)        — `Lock01` icon, "Set new password"
//   step 4 (success)      — `CheckCircle` icon, "Password reset"
//
// On success the page navigates to `/login` after a 2s delay (or the
// user can click "Sign in" immediately).

import { useEffect, useState, type ReactNode, type SyntheticEvent } from 'react';

import {
  AuthFooter,
  AuthLayout,
  Button,
  FormField,
  PasswordInput,
  VerificationCodeInput,
  useFormFieldDescriptors,
} from '@glaon/ui';

import { useForgotPassword } from './use-forgot-password';

const SUCCESS_AUTOREDIRECT_MS = 2000;

interface ForgotPasswordPageProps {
  navigate?: ((url: string) => void) | undefined;
}

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
      <ForgotPasswordLayout icon={<FeaturedIcon name="key" />}>
        <Heading
          title="Forgot password?"
          subtitle="No worries, we'll send you reset instructions."
        />
        <EmailStep
          isLoaded={isLoaded}
          isSubmitting={state.status === 'submitting'}
          error={state.error?.message}
          onSubmit={(email) => {
            void requestReset(email);
          }}
        />
        <AuthFooter linkText="Back to log in" linkHref="/login" iconLeading="arrow-left" />
      </ForgotPasswordLayout>
    );
  }

  if (state.step === 'check-email') {
    return (
      <ForgotPasswordLayout icon={<FeaturedIcon name="mail" />}>
        <Heading
          title="Check your email"
          subtitle={`We sent a password reset link to ${state.email}.`}
        />
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
      </ForgotPasswordLayout>
    );
  }

  if (state.step === 'reset') {
    return (
      <ForgotPasswordLayout icon={<FeaturedIcon name="lock" />}>
        <Heading title="Set new password" subtitle={`Enter the code we sent to ${state.email}.`} />
        <ResetStep
          isLoaded={isLoaded}
          isSubmitting={state.status === 'submitting'}
          error={state.error?.message}
          onSubmit={(input) => {
            void resetPassword(input);
          }}
        />
        <AuthFooter linkText="Back to log in" linkHref="/login" iconLeading="arrow-left" />
      </ForgotPasswordLayout>
    );
  }

  // success
  return (
    <ForgotPasswordLayout icon={<FeaturedIcon name="check" />}>
      <Heading
        title="Password reset"
        subtitle="Your password has been updated. Sign in to continue."
      />
      <Button size="lg" onClick={goToLogin}>
        Sign in
      </Button>
    </ForgotPasswordLayout>
  );
}

function ForgotPasswordLayout({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}): ReactNode {
  return (
    <AuthLayout
      variant="centered"
      iconSlot={icon}
      footerSlot={<span>© Glaon {new Date().getFullYear().toString()}</span>}
    >
      {children}
    </AuthLayout>
  );
}

function Heading({ title, subtitle }: { title: string; subtitle: string }): ReactNode {
  return (
    <div>
      <h1 className="text-display-sm font-semibold text-primary">{title}</h1>
      <p className="mt-2 text-md text-tertiary">{subtitle}</p>
    </div>
  );
}

function EmailStep({
  isLoaded,
  isSubmitting,
  error,
  onSubmit,
}: {
  isLoaded: boolean;
  isSubmitting: boolean;
  error: string | undefined;
  onSubmit: (email: string) => void;
}): ReactNode {
  const [email, setEmail] = useState('');
  const emailField = useFormFieldDescriptors('forgot-email');
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
      <FormField
        label="Email"
        htmlFor="forgot-email"
        {...(error !== undefined ? { error } : {})}
        isRequired
      >
        <input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.currentTarget.value);
          }}
          aria-invalid={error !== undefined}
          aria-describedby={emailField.describedBy(error !== undefined, false)}
          className="w-full rounded-lg bg-primary px-3 py-2 text-md text-primary shadow-xs ring-1 ring-primary ring-inset focus:outline-hidden focus:ring-2 focus:ring-brand"
          placeholder="Enter your email"
        />
      </FormField>
      <Button type="submit" size="lg" isLoading={isSubmitting} isDisabled={!isLoaded}>
        Reset password
      </Button>
    </form>
  );
}

function ResetStep({
  isLoaded,
  isSubmitting,
  error,
  onSubmit,
}: {
  isLoaded: boolean;
  isSubmitting: boolean;
  error: string | undefined;
  onSubmit: (input: { code: string; password: string; confirmPassword: string }) => void;
}): ReactNode {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
        {...(error !== undefined ? { isInvalid: true } : {})}
      />
      <PasswordInput
        label="New password"
        autoComplete="new-password"
        hint="Must be at least 8 characters."
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
      {error !== undefined && (
        <p role="alert" data-testid="forgot-reset-error" className="text-sm text-error">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" isLoading={isSubmitting} isDisabled={!isLoaded}>
        Reset password
      </Button>
    </form>
  );
}
