// `useCloudSignUp` — drives the Sign-up screen via Clerk's headless
// `useSignUp()` hook. The screen renders the form with Glaon
// primitives so the UX matches the Figma design pixel-for-pixel; the
// hook owns the SDK orchestration + state machine.
//
// On a successful `signUp.create({...})` call we trigger the
// email-code verification flow and bubble up "verify" so the page
// component can navigate to `/verify-email?after=signup` (handled in
// #473 / F).

import { useSignUp } from '@clerk/clerk-react';
import { useCallback, useState } from 'react';

// Internal types — only the `useCloudSignUp` hook is consumed
// outside this module, so knip flags wider exports.
type CloudSignUpErrorCode =
  | 'form_param_format_invalid'
  | 'form_password_pwned'
  | 'form_password_length_too_short'
  | 'form_identifier_exists'
  | 'unknown';

interface CloudSignUpErrorState {
  readonly code: CloudSignUpErrorCode;
  readonly fieldKey?: 'name' | 'email' | 'password' | 'confirmPassword';
  readonly message: string;
}

type CloudSignUpState =
  | { readonly status: 'idle' }
  | { readonly status: 'submitting' }
  | { readonly status: 'awaiting_verification' }
  | { readonly status: 'error'; readonly error: CloudSignUpErrorState };

interface CloudSignUpInput {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
}

export function useCloudSignUp(): {
  state: CloudSignUpState;
  submit: (input: CloudSignUpInput) => Promise<void>;
  signUpWithSocial: (strategy: 'oauth_google' | 'oauth_apple') => Promise<void>;
  reset: () => void;
  isLoaded: boolean;
} {
  const { signUp, isLoaded } = useSignUp();
  const [state, setState] = useState<CloudSignUpState>({ status: 'idle' });

  const submit = useCallback(
    async (input: CloudSignUpInput) => {
      if (!isLoaded) return;

      // Client-side guards before we hit Clerk: matching passwords +
      // ≥8-character length. Clerk also enforces these but a local
      // check produces a faster, field-targeted error on the form.
      if (input.password !== input.confirmPassword) {
        setState({
          status: 'error',
          error: {
            code: 'form_param_format_invalid',
            fieldKey: 'confirmPassword',
            message: "Passwords don't match.",
          },
        });
        return;
      }
      if (input.password.length < 8) {
        setState({
          status: 'error',
          error: {
            code: 'form_password_length_too_short',
            fieldKey: 'password',
            message: 'Password must be at least 8 characters.',
          },
        });
        return;
      }

      setState({ status: 'submitting' });
      try {
        const trimmed = input.name.trim();
        const firstName = trimmed.split(/\s+/)[0] ?? trimmed;
        const lastName = trimmed.includes(' ') ? trimmed.slice(firstName.length).trim() : undefined;
        await signUp.create({
          emailAddress: input.email,
          password: input.password,
          firstName,
          ...(lastName !== undefined && lastName.length > 0 ? { lastName } : {}),
        });
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setState({ status: 'awaiting_verification' });
      } catch (cause) {
        setState({ status: 'error', error: errorFromCause(cause) });
      }
    },
    [isLoaded, signUp],
  );

  const signUpWithSocial = useCallback(
    async (strategy: 'oauth_google' | 'oauth_apple') => {
      if (!isLoaded) return;
      setState({ status: 'submitting' });
      try {
        await signUp.authenticateWithRedirect({
          strategy,
          redirectUrl: '/auth/sso-callback',
          redirectUrlComplete: '/',
        });
      } catch (cause) {
        setState({ status: 'error', error: errorFromCause(cause) });
      }
    },
    [isLoaded, signUp],
  );

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return { state, submit, signUpWithSocial, reset, isLoaded };
}

function errorFromCause(cause: unknown): CloudSignUpErrorState {
  if (typeof cause === 'object' && cause !== null && 'errors' in cause) {
    const errors = (cause as { errors?: unknown }).errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const first = errors[0] as {
        code?: unknown;
        longMessage?: unknown;
        message?: unknown;
        meta?: { paramName?: unknown };
      };
      const code = (
        typeof first.code === 'string' ? first.code : 'unknown'
      ) as CloudSignUpErrorCode;
      const param = first.meta?.paramName;
      const fieldKey = mapParamToField(typeof param === 'string' ? param : undefined);
      const message =
        typeof first.longMessage === 'string'
          ? first.longMessage
          : typeof first.message === 'string'
            ? first.message
            : 'Sign up failed.';
      const error: CloudSignUpErrorState = { code, message };
      if (fieldKey !== undefined) (error as { fieldKey?: typeof fieldKey }).fieldKey = fieldKey;
      return error;
    }
  }
  return { code: 'unknown', message: 'Sign up failed. Try again in a moment.' };
}

function mapParamToField(param: string | undefined): CloudSignUpErrorState['fieldKey'] {
  if (param === undefined) return undefined;
  if (param === 'email_address' || param === 'email') return 'email';
  if (param === 'password') return 'password';
  if (param === 'first_name' || param === 'last_name' || param === 'name') return 'name';
  return undefined;
}
