// `useEmailVerification` — drives the three-step Email verification
// flow (#473). The page mounts behind `/verify-email?after=signup`
// (post-signup verification, the only mode this PR ships) and walks
// the user through:
//
//   1. Check email — confirmation that we sent a code.
//   2. Code entry — `signUp.attemptEmailAddressVerification({code})`.
//      The page renders `<VerificationCodeInput>` (auto-submits when
//      every cell is filled).
//   3. Success   — sets the active session if Clerk returned one and
//      hands off navigation to `/` to the page component.
//
// Email-change (`?after=email-change`) reads the user's pending email
// from `useUser()` instead and uses `user.update + verifyEmailAddress`;
// that path is out of scope for this PR.

import { useSignUp } from '@clerk/clerk-react';
import { useCallback, useReducer } from 'react';

// Internal types — only the `useEmailVerification` hook is consumed
// outside this module, so knip flags wider exports.
type VerifyStep = 'enter-code' | 'success';

type VerifyErrorCode =
  | 'form_code_incorrect'
  | 'form_code_expired'
  | 'verification_too_many_failures'
  | 'unknown';

interface VerifyErrorState {
  readonly code: VerifyErrorCode;
  readonly message: string;
}

interface VerifyMachineState {
  readonly step: VerifyStep;
  readonly status: 'idle' | 'submitting';
  readonly attempts: number;
  readonly error: VerifyErrorState | null;
}

type Action =
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; error: VerifyErrorState };

const MAX_ATTEMPTS = 5;
const initial: VerifyMachineState = {
  step: 'enter-code',
  status: 'idle',
  attempts: 0,
  error: null,
};

function reducer(state: VerifyMachineState, action: Action): VerifyMachineState {
  switch (action.kind) {
    case 'submitting':
      return { ...state, status: 'submitting', error: null };
    case 'success':
      return { ...state, step: 'success', status: 'idle', error: null };
    case 'error':
      return {
        ...state,
        status: 'idle',
        attempts: state.attempts + 1,
        error: action.error,
      };
    default:
      return state;
  }
}

export function useEmailVerification(): {
  state: VerifyMachineState;
  isLocked: boolean;
  attemptCode: (code: string) => Promise<void>;
  resend: () => Promise<void>;
  isLoaded: boolean;
} {
  const { signUp, isLoaded, setActive } = useSignUp();
  const [state, dispatch] = useReducer(reducer, initial);
  const isLocked = state.attempts >= MAX_ATTEMPTS;

  const attemptCode = useCallback(
    async (code: string) => {
      if (!isLoaded || isLocked) return;
      dispatch({ kind: 'submitting' });
      try {
        const result = await signUp.attemptEmailAddressVerification({ code });
        if (result.status === 'complete') {
          if (result.createdSessionId !== null) {
            await setActive({ session: result.createdSessionId });
          }
          dispatch({ kind: 'success' });
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
    [isLoaded, isLocked, setActive, signUp],
  );

  const resend = useCallback(async () => {
    if (!isLoaded) return;
    dispatch({ kind: 'submitting' });
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      dispatch({ kind: 'success' });
    } catch (cause) {
      dispatch({ kind: 'error', error: errorFromCause(cause) });
    }
  }, [isLoaded, signUp]);

  return { state, isLocked, attemptCode, resend, isLoaded };
}

function errorFromCause(cause: unknown): VerifyErrorState {
  if (typeof cause === 'object' && cause !== null && 'errors' in cause) {
    const errors = (cause as { errors?: unknown }).errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const first = errors[0] as { code?: unknown; longMessage?: unknown; message?: unknown };
      const code = (typeof first.code === 'string' ? first.code : 'unknown') as VerifyErrorCode;
      const message =
        typeof first.longMessage === 'string'
          ? first.longMessage
          : typeof first.message === 'string'
            ? first.message
            : 'That code did not work.';
      return { code, message };
    }
  }
  return { code: 'unknown', message: 'That code did not work. Try again.' };
}
