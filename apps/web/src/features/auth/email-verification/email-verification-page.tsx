// EmailVerificationPage — three-step centered-card flow for the
// post-signup email verification per Figma (#473). The page mounts
// behind `/verify-email?after=signup` and orchestrates the
// `useEmailVerification` state machine + a 60s resend cooldown.

import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { AuthFooter, AuthLayout, Button, VerificationCodeInput } from '@glaon/ui';

import { useEmailVerification } from './use-email-verification';

const RESEND_COOLDOWN_SECONDS = 60;

interface EmailVerificationPageProps {
  /**
   * Optional override for the email surfaced in the description copy
   * (e.g. "We sent a code to olivia@untitledui.com"). When omitted the
   * page falls back to a generic "Check your email" string.
   */
  email?: string;
  navigate?: ((url: string) => void) | undefined;
}

const MAIL_ICON_PATH =
  'm3 7 8.165 5.71a1.5 1.5 0 0 0 1.67 0L21 7M5 18h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z';
const CHECK_ICON_PATH = 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z';

function FeaturedIcon({ path }: { path: string }): ReactNode {
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
        <path d={path} />
      </svg>
    </div>
  );
}

export function EmailVerificationPage({ email, navigate }: EmailVerificationPageProps): ReactNode {
  const { state, isLocked, attemptCode, resend, isLoaded } = useEmailVerification();
  const [code, setCode] = useState<string>('');
  const [resendIn, setResendIn] = useState<number>(RESEND_COOLDOWN_SECONDS);

  // Tick the resend cooldown once a second. We start at the full
  // cooldown so users can't immediately resend on first load (the
  // verification email was sent server-side during sign-up); resend()
  // resets the countdown on click.
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => {
      setResendIn(resendIn - 1);
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [resendIn]);

  // After success: hand off navigation to `/` so the cloud-session
  // bridge picks the new mode + the dashboard renders.
  useEffect(() => {
    if (state.step !== 'success') return;
    const go =
      navigate ??
      ((url: string) => {
        window.location.assign(url);
      });
    go('/');
  }, [navigate, state.step]);

  const onResend = (): void => {
    void resend();
    setResendIn(RESEND_COOLDOWN_SECONDS);
  };

  const errorMessage = useMemo(() => {
    if (isLocked) {
      return 'Too many incorrect attempts. Click "Resend code" to send a new one.';
    }
    return state.error?.message;
  }, [isLocked, state.error]);

  if (state.step === 'success') {
    return (
      <AuthLayout
        variant="centered"
        iconSlot={<FeaturedIcon path={CHECK_ICON_PATH} />}
        footerSlot={<span>© Glaon {new Date().getFullYear().toString()}</span>}
      >
        <div>
          <h1 className="text-display-sm font-semibold text-primary">Email verified</h1>
          <p className="mt-2 text-md text-tertiary">Welcome to Glaon — taking you in now.</p>
        </div>
      </AuthLayout>
    );
  }

  const subtitle =
    email !== undefined && email.length > 0
      ? `We sent a verification code to ${email}.`
      : 'We sent a verification code to your inbox.';

  return (
    <AuthLayout
      variant="centered"
      iconSlot={<FeaturedIcon path={MAIL_ICON_PATH} />}
      footerSlot={<span>© Glaon {new Date().getFullYear().toString()}</span>}
    >
      <div>
        <h1 className="text-display-sm font-semibold text-primary">Check your email</h1>
        <p className="mt-2 text-md text-tertiary">{subtitle}</p>
      </div>

      <form
        data-testid="verify-email-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (code.length === 6) {
            void attemptCode(code);
          }
        }}
        className="flex w-full flex-col items-center gap-4"
        noValidate
      >
        <VerificationCodeInput
          digits={6}
          value={code}
          onChange={setCode}
          onComplete={(filled) => {
            void attemptCode(filled);
          }}
          ariaLabel="Verification code"
          {...(errorMessage !== undefined ? { isInvalid: true, hint: errorMessage } : {})}
          isDisabled={isLocked}
        />

        <Button
          type="submit"
          size="lg"
          isLoading={state.status === 'submitting'}
          isDisabled={!isLoaded || isLocked || code.length !== 6}
        >
          Verify email
        </Button>

        <p className="text-sm text-tertiary">
          Didn&apos;t receive the email?{' '}
          {resendIn > 0 ? (
            <span className="font-semibold">Resend in {String(resendIn)}s</span>
          ) : (
            <button
              type="button"
              data-testid="verify-email-resend"
              className="font-semibold text-secondary hover:text-primary"
              onClick={onResend}
            >
              Click to resend
            </button>
          )}
        </p>
      </form>

      <AuthFooter linkText="Back to log in" linkHref="/login" iconLeading="arrow-left" />
    </AuthLayout>
  );
}
