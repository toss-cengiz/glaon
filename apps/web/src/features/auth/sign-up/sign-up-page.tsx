// SignUpPage — Glaon-rendered headless Clerk sign-up form (#471).
// Replaces the legacy `<SignUpRoute>` (Clerk hosted view) with the
// split-screen Figma design and wires the SDK via `useCloudSignUp`.
//
// On success the form navigates to `/verify-email?after=signup`.
//
// Figma reference: Design-System / Sign up / node 14530:2343
// (Desktop + Mobile). #527 brings the page in line with the
// Design-System Fidelity Rule and the API Error Toast Rule —
// `<Input>` primitive instead of raw `<input>`, no marketing
// checkbox (the Figma frame doesn't show one), and general API
// failures route through `useToast()` instead of an inline block.
// Field-level Clerk errors stay inline on the `<Input>` itself
// (Toast Rule explicitly allows per-field validation copy).

import { useEffect, useState, type ReactNode, type SyntheticEvent } from 'react';

import {
  AuthFooter,
  AuthLayout,
  Button,
  Input,
  PasswordInput,
  SocialButton,
  useToast,
} from '@glaon/ui';

import { useCloudSignUp } from './use-cloud-sign-up';

interface SignUpPageProps {
  /** Hero image rendered on the right column (split layout). */
  imageSlot?: ReactNode;
  /** Navigation injection — defaults to `window.location.assign`. */
  navigate?: ((url: string) => void) | undefined;
}

interface ToastCopy {
  readonly title: string;
  readonly description?: string;
}

// Per the API Error Toast Rule (CLAUDE.md), every error code that
// reaches the UI maps to specific copy here — generic fallback is
// reserved for `unknown` only. Mirrors `CloudSignUpErrorCode` from
// `use-cloud-sign-up.ts`. Field-level errors (`fieldKey !== undefined`)
// never hit this table because they render inline on `<Input>`.
const SIGNUP_UNKNOWN_COPY: ToastCopy = {
  title: 'Sign-up failed',
  description: 'Something went wrong with Glaon Cloud. Try again in a moment.',
};

const SIGNUP_ERROR_COPY: Record<string, ToastCopy> = {
  form_param_format_invalid: {
    title: 'Check your details',
    description: 'One of the fields you entered isn’t in the right format. Try again.',
  },
  form_password_pwned: {
    title: 'That password isn’t safe',
    description:
      'This password appears in known data breaches. Pick a different one to keep your account secure.',
  },
  form_password_length_too_short: {
    title: 'Password too short',
    description: 'Use at least 8 characters for your account password.',
  },
  form_identifier_exists: {
    title: 'You already have an account',
    description: 'That email is already in use. Sign in instead, or use a different address.',
  },
  unknown: SIGNUP_UNKNOWN_COPY,
};

export function SignUpPage({ imageSlot, navigate }: SignUpPageProps): ReactNode {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const { state, submit, signUpWithSocial, isLoaded } = useCloudSignUp();
  const toast = useToast();

  useEffect(() => {
    if (state.status === 'awaiting_verification') {
      const go =
        navigate ??
        ((url: string) => {
          window.location.assign(url);
        });
      go('/verify-email?after=signup');
    }
    // Non-field (general) errors flow through Toast; field errors
    // render inline on the matching <Input>/<PasswordInput>.
    if (state.status === 'error' && state.error.fieldKey === undefined) {
      const copy = SIGNUP_ERROR_COPY[state.error.code] ?? SIGNUP_UNKNOWN_COPY;
      toast.show({ intent: 'danger', ...copy });
    }
  }, [navigate, state, toast]);

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit({ name, email, password, confirmPassword });
  };

  const isSubmitting = state.status === 'submitting';
  const error = state.status === 'error' ? state.error : null;
  const fieldError = (
    field: 'name' | 'email' | 'password' | 'confirmPassword',
  ): string | undefined => (error?.fieldKey === field ? error.message : undefined);

  return (
    <AuthLayout
      variant="split"
      imageSlot={imageSlot}
      title="Sign up"
      subtitle="Start your 30-day free trial."
    >
      <form
        data-testid="signup-form"
        onSubmit={onSubmit}
        className="flex flex-col gap-5"
        noValidate
      >
        <Input
          label="Name"
          name="name"
          type="text"
          autoComplete="name"
          isRequired
          value={name}
          onChange={setName}
          placeholder="Enter your name"
          isInvalid={fieldError('name') !== undefined}
          {...(fieldError('name') !== undefined ? { hint: fieldError('name') } : {})}
        />

        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          isRequired
          value={email}
          onChange={setEmail}
          placeholder="Enter your email"
          isInvalid={fieldError('email') !== undefined}
          {...(fieldError('email') !== undefined ? { hint: fieldError('email') } : {})}
        />

        <PasswordInput
          label="Password"
          autoComplete="new-password"
          hint="Must be at least 8 characters."
          {...(fieldError('password') !== undefined ? { error: fieldError('password') } : {})}
          value={password}
          onChange={setPassword}
          isRequired
          placeholder="Create a password"
        />

        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          {...(fieldError('confirmPassword') !== undefined
            ? { error: fieldError('confirmPassword') }
            : {})}
          value={confirmPassword}
          onChange={setConfirmPassword}
          isRequired
        />

        <Button type="submit" size="lg" isLoading={isSubmitting} isDisabled={!isLoaded}>
          Get started
        </Button>

        <SocialButton
          brand="google"
          onPress={() => {
            void signUpWithSocial('oauth_google');
          }}
        >
          Sign up with Google
        </SocialButton>
        <SocialButton
          brand="apple"
          onPress={() => {
            void signUpWithSocial('oauth_apple');
          }}
        >
          Sign up with Apple
        </SocialButton>

        <AuthFooter prompt="Already have an account?" linkText="Log in" linkHref="/login" />
      </form>
    </AuthLayout>
  );
}
