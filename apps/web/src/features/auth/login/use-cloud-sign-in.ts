// `useCloudSignIn` — drives the Login screen's Cloud tab via Clerk's
// headless `useSignIn()` hook. We don't render the kit's `<SignIn />`
// component anywhere in the auth flow because the brand-controlled
// form lives in the LoginPage; the hook just orchestrates Clerk SDK
// calls and surfaces a state machine the form can react to.

import { useSignIn } from '@clerk/clerk-react';
import { useCallback, useState } from 'react';

// Internal types — only the `useCloudSignIn` hook is consumed
// outside this module, so knip flags wider exports.
type CloudSignInErrorCode =
  | 'form_param_format_invalid'
  | 'form_password_incorrect'
  | 'form_identifier_not_found'
  | 'session_exists'
  | 'unknown';

interface CloudSignInErrorState {
  readonly code: CloudSignInErrorCode;
  readonly message: string;
}

type CloudSignInState =
  | { readonly status: 'idle' }
  | { readonly status: 'submitting' }
  | { readonly status: 'success' }
  | { readonly status: 'error'; readonly error: CloudSignInErrorState };

interface CloudSignInInput {
  readonly identifier: string;
  readonly password: string;
}

export function useCloudSignIn(): {
  state: CloudSignInState;
  submit: (input: CloudSignInInput) => Promise<void>;
  signInWithSocial: (strategy: 'oauth_google' | 'oauth_apple') => Promise<void>;
  reset: () => void;
  isLoaded: boolean;
} {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [state, setState] = useState<CloudSignInState>({ status: 'idle' });

  const submit = useCallback(
    async (input: CloudSignInInput) => {
      if (!isLoaded) return;
      setState({ status: 'submitting' });
      try {
        const result = await signIn.create({
          identifier: input.identifier,
          password: input.password,
        });
        if (result.status === 'complete') {
          if (result.createdSessionId !== null) {
            await setActive({ session: result.createdSessionId });
          }
          setState({ status: 'success' });
          return;
        }
        // Multi-step flows (MFA, etc.) — surface as a generic message
        // and leave the user with the option to fall back to the kit's
        // hosted SignIn (link in the form footer).
        setState({
          status: 'error',
          error: {
            code: 'unknown',
            message: 'Additional verification is required for this account.',
          },
        });
      } catch (cause) {
        setState({ status: 'error', error: errorFromCause(cause) });
      }
    },
    [isLoaded, setActive, signIn],
  );

  const signInWithSocial = useCallback(
    async (strategy: 'oauth_google' | 'oauth_apple') => {
      if (!isLoaded) return;
      setState({ status: 'submitting' });
      try {
        await signIn.authenticateWithRedirect({
          strategy,
          redirectUrl: '/auth/sso-callback',
          redirectUrlComplete: '/',
        });
      } catch (cause) {
        setState({ status: 'error', error: errorFromCause(cause) });
      }
    },
    [isLoaded, signIn],
  );

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return { state, submit, signInWithSocial, reset, isLoaded };
}

function errorFromCause(cause: unknown): CloudSignInErrorState {
  // Clerk throws an error whose `errors` array contains the canonical
  // error code; we surface the first one's `code` + `longMessage` (or
  // a fallback string).
  if (typeof cause === 'object' && cause !== null && 'errors' in cause) {
    const errors = (cause as { errors?: unknown }).errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const first = errors[0] as { code?: unknown; longMessage?: unknown; message?: unknown };
      const code = (
        typeof first.code === 'string' ? first.code : 'unknown'
      ) as CloudSignInErrorCode;
      const message =
        typeof first.longMessage === 'string'
          ? first.longMessage
          : typeof first.message === 'string'
            ? first.message
            : 'Sign in failed.';
      return { code, message };
    }
  }
  return { code: 'unknown', message: 'Sign in failed. Try again in a moment.' };
}
