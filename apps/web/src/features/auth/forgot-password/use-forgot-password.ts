// `useForgotPassword` — drives the four-step Forgot password flow
// (#472) via Clerk's headless `useSignIn()` hook with the
// `reset_password_email_code` strategy. The page component owns the
// per-step UI; the hook owns the SDK orchestration + state machine.

import { useSignIn } from '@clerk/clerk-react';
import { useCallback, useReducer } from 'react';

// Internal types — only the `useForgotPassword` hook is consumed
// outside this module, so knip flags wider exports.
type ForgotStep = 'email' | 'check-email' | 'reset' | 'success';

type ForgotErrorCode =
  | 'form_param_format_invalid'
  | 'form_identifier_not_found'
  | 'form_code_incorrect'
  | 'form_code_expired'
  | 'form_password_pwned'
  | 'unknown';

interface ForgotErrorState {
  readonly code: ForgotErrorCode;
  readonly message: string;
}

interface ForgotMachineState {
  readonly step: ForgotStep;
  readonly email: string;
  readonly status: 'idle' | 'submitting';
  readonly error: ForgotErrorState | null;
}

type Action =
  | { kind: 'submitting' }
  | { kind: 'email-sent'; email: string }
  | { kind: 'go-to-reset' }
  | { kind: 'reset-success' }
  | { kind: 'error'; error: ForgotErrorState }
  | { kind: 'back' };

const initial: ForgotMachineState = {
  step: 'email',
  email: '',
  status: 'idle',
  error: null,
};

function reducer(state: ForgotMachineState, action: Action): ForgotMachineState {
  switch (action.kind) {
    case 'submitting':
      return { ...state, status: 'submitting', error: null };
    case 'email-sent':
      return { step: 'check-email', email: action.email, status: 'idle', error: null };
    case 'go-to-reset':
      return { ...state, step: 'reset', status: 'idle', error: null };
    case 'reset-success':
      return { ...state, step: 'success', status: 'idle', error: null };
    case 'error':
      return { ...state, status: 'idle', error: action.error };
    case 'back':
      if (state.step === 'check-email') return { ...initial, email: state.email };
      if (state.step === 'reset') return { ...state, step: 'check-email', error: null };
      return state;
    default:
      return state;
  }
}

export function useForgotPassword(): {
  state: ForgotMachineState;
  requestReset: (email: string) => Promise<void>;
  resendCode: () => Promise<void>;
  goToReset: () => void;
  resetPassword: (input: {
    code: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  back: () => void;
  isLoaded: boolean;
} {
  const { signIn, isLoaded, setActive } = useSignIn();
  const [state, dispatch] = useReducer(reducer, initial);

  const requestReset = useCallback(
    async (email: string) => {
      if (!isLoaded) return;
      dispatch({ kind: 'submitting' });
      try {
        await signIn.create({
          strategy: 'reset_password_email_code',
          identifier: email,
        });
        dispatch({ kind: 'email-sent', email });
      } catch (cause) {
        dispatch({ kind: 'error', error: errorFromCause(cause) });
      }
    },
    [isLoaded, signIn],
  );

  const resendCode = useCallback(async () => {
    if (!isLoaded || state.email.length === 0) return;
    dispatch({ kind: 'submitting' });
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: state.email,
      });
      dispatch({ kind: 'email-sent', email: state.email });
    } catch (cause) {
      dispatch({ kind: 'error', error: errorFromCause(cause) });
    }
  }, [isLoaded, signIn, state.email]);

  const goToReset = useCallback(() => {
    dispatch({ kind: 'go-to-reset' });
  }, []);

  const resetPassword = useCallback(
    async (input: { code: string; password: string; confirmPassword: string }) => {
      if (!isLoaded) return;
      if (input.password !== input.confirmPassword) {
        dispatch({
          kind: 'error',
          error: { code: 'form_param_format_invalid', message: "Passwords don't match." },
        });
        return;
      }
      if (input.password.length < 8) {
        dispatch({
          kind: 'error',
          error: {
            code: 'form_param_format_invalid',
            message: 'Password must be at least 8 characters.',
          },
        });
        return;
      }
      dispatch({ kind: 'submitting' });
      try {
        const result = await signIn.attemptFirstFactor({
          strategy: 'reset_password_email_code',
          code: input.code,
          password: input.password,
        });
        if (result.status === 'complete') {
          if (result.createdSessionId !== null) {
            await setActive({ session: result.createdSessionId });
          }
          dispatch({ kind: 'reset-success' });
          return;
        }
        dispatch({
          kind: 'error',
          error: { code: 'unknown', message: 'Additional verification is required.' },
        });
      } catch (cause) {
        dispatch({ kind: 'error', error: errorFromCause(cause) });
      }
    },
    [isLoaded, setActive, signIn],
  );

  const back = useCallback(() => {
    dispatch({ kind: 'back' });
  }, []);

  return { state, requestReset, resendCode, goToReset, resetPassword, back, isLoaded };
}

function errorFromCause(cause: unknown): ForgotErrorState {
  if (typeof cause === 'object' && cause !== null && 'errors' in cause) {
    const errors = (cause as { errors?: unknown }).errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const first = errors[0] as { code?: unknown; longMessage?: unknown; message?: unknown };
      const code = (typeof first.code === 'string' ? first.code : 'unknown') as ForgotErrorCode;
      const message =
        typeof first.longMessage === 'string'
          ? first.longMessage
          : typeof first.message === 'string'
            ? first.message
            : 'Reset failed.';
      return { code, message };
    }
  }
  return { code: 'unknown', message: 'Reset failed. Try again in a moment.' };
}
