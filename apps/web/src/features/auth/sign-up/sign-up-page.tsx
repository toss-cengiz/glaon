// SignUpPage — Glaon-rendered headless Clerk sign-up form (#471).
// Replaces the legacy `<SignUpRoute>` (Clerk hosted view) with the
// split-screen Figma design and wires the SDK via `useCloudSignUp`.
//
// On success the form navigates to `/verify-email?after=signup`
// (handled by #473 / F). Until F merges, the route renders a
// placeholder; this PR's scope ends at the redirect.

import { useEffect, useState, type ReactNode, type SyntheticEvent } from 'react';

import {
  AuthFooter,
  AuthLayout,
  Button,
  Checkbox,
  FormField,
  PasswordInput,
  SocialButton,
  useFormFieldDescriptors,
} from '@glaon/ui';

import { useCloudSignUp } from './use-cloud-sign-up';

interface SignUpPageProps {
  /** Hero image rendered on the right column (split layout). */
  imageSlot?: ReactNode;
  /** Navigation injection — defaults to `window.location.assign`. */
  navigate?: ((url: string) => void) | undefined;
}

export function SignUpPage({ imageSlot, navigate }: SignUpPageProps): ReactNode {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [marketingOptIn, setMarketingOptIn] = useState<boolean>(false);
  const { state, submit, signUpWithSocial, isLoaded } = useCloudSignUp();
  const nameField = useFormFieldDescriptors('signup-name');
  const emailField = useFormFieldDescriptors('signup-email');

  useEffect(() => {
    if (state.status === 'awaiting_verification') {
      const go =
        navigate ??
        ((url: string) => {
          window.location.assign(url);
        });
      go('/verify-email?after=signup');
    }
  }, [navigate, state]);

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit({ name, email, password, confirmPassword });
  };

  const isSubmitting = state.status === 'submitting';
  const error = state.status === 'error' ? state.error : null;
  const fieldError = (
    field: 'name' | 'email' | 'password' | 'confirmPassword',
  ): string | undefined => (error?.fieldKey === field ? error.message : undefined);
  const generalError = error !== null && error.fieldKey === undefined ? error.message : undefined;

  return (
    <AuthLayout
      variant="split"
      imageSlot={imageSlot}
      footerSlot={<span>© Glaon {new Date().getFullYear().toString()}</span>}
    >
      <header className="flex flex-col gap-2">
        <h1 className="text-display-sm font-semibold text-primary">Sign up</h1>
        <p className="text-md text-tertiary">Start your 30-day free trial.</p>
      </header>

      <form
        data-testid="signup-form"
        onSubmit={onSubmit}
        className="flex flex-col gap-4"
        noValidate
      >
        <FormField
          label="Name"
          htmlFor="signup-name"
          {...(fieldError('name') !== undefined ? { error: fieldError('name') } : {})}
          isRequired
        >
          <input
            id="signup-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.currentTarget.value);
            }}
            aria-invalid={fieldError('name') !== undefined}
            aria-describedby={nameField.describedBy(fieldError('name') !== undefined, false)}
            className="w-full rounded-lg bg-primary px-3 py-2 text-md text-primary shadow-xs ring-1 ring-primary ring-inset focus:outline-hidden focus:ring-2 focus:ring-brand"
            placeholder="Enter your name"
          />
        </FormField>

        <FormField
          label="Email"
          htmlFor="signup-email"
          {...(fieldError('email') !== undefined ? { error: fieldError('email') } : {})}
          isRequired
        >
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.currentTarget.value);
            }}
            aria-invalid={fieldError('email') !== undefined}
            aria-describedby={emailField.describedBy(fieldError('email') !== undefined, false)}
            className="w-full rounded-lg bg-primary px-3 py-2 text-md text-primary shadow-xs ring-1 ring-primary ring-inset focus:outline-hidden focus:ring-2 focus:ring-brand"
            placeholder="Enter your email"
          />
        </FormField>

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

        <Checkbox
          isSelected={marketingOptIn}
          onChange={setMarketingOptIn}
          label="Send me product updates and announcements (optional)."
        />

        {generalError !== undefined && (
          <p role="alert" data-testid="signup-error" className="text-sm text-error">
            {generalError}
          </p>
        )}

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
