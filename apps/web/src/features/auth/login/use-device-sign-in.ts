// `useDeviceSignIn` — drives the Login screen's Device tab via the
// `/auth/ha/password-grant` endpoint (#468 / ADR 0027). The hook owns
// the in-flight + error state machine; the form component only reads
// `state` and dispatches `submit(...)`.
//
// The hook never persists credentials — the password is read from the
// form, sent over HTTPS to apps/api, and dropped from memory the
// instant the response arrives. On success the hook calls
// `setLocalAuth(...)` from the AuthProvider so the rest of the app
// reads `mode: 'local'` and re-renders into the dashboard.

import { useCallback, useMemo, useState } from 'react';

import type { ApiClient } from '@glaon/core/api-client';
import type { HaAuthTokens } from '@glaon/core/auth';

import { useAuth } from '../../../auth/auth-provider';
import { createApiClient } from '../../../api/api-client';

// Internal types — only the `useDeviceSignIn` hook is consumed
// outside this module, so knip flags wider exports.
type DeviceSignInErrorCode =
  | 'invalid-url'
  | 'invalid-credentials'
  | 'mfa-required'
  | 'unreachable'
  | 'flow-error'
  | 'unknown';

interface DeviceSignInErrorState {
  readonly code: DeviceSignInErrorCode;
  readonly message: string;
}

type DeviceSignInState =
  | { readonly status: 'idle' }
  | { readonly status: 'submitting' }
  | { readonly status: 'success' }
  | { readonly status: 'error'; readonly error: DeviceSignInErrorState };

interface DeviceSignInInput {
  readonly haBaseUrl: string;
  readonly username: string;
  readonly password: string;
  readonly clientId: string;
}

interface UseDeviceSignInOptions {
  /** Override the ApiClient — used by tests to inject a fake. */
  readonly apiClient?: ApiClient;
}

export function useDeviceSignIn(options: UseDeviceSignInOptions = {}): {
  state: DeviceSignInState;
  submit: (input: DeviceSignInInput) => Promise<void>;
  reset: () => void;
} {
  const { tokenStore, setLocalAuth } = useAuth();
  const fallbackClient = useMemo(
    () => options.apiClient ?? createApiClient(tokenStore),
    [options.apiClient, tokenStore],
  );
  const [state, setState] = useState<DeviceSignInState>({ status: 'idle' });

  const submit = useCallback(
    async (input: DeviceSignInInput) => {
      setState({ status: 'submitting' });
      try {
        const response = await fallbackClient.haPasswordGrant(input);
        const tokens: HaAuthTokens = {
          access_token: response.haAccess.accessToken,
          refresh_token: response.haAccess.refreshToken,
          expires_in: response.haAccess.expiresIn,
          token_type: response.haAccess.tokenType,
          issued_at: Date.now(),
        };
        await tokenStore.set({
          kind: 'ha-access',
          token: tokens.access_token,
          expiresAt: Date.now() + tokens.expires_in * 1000,
        });
        await tokenStore.set({
          kind: 'ha-refresh',
          token: tokens.refresh_token,
        });
        setLocalAuth(tokens);
        setState({ status: 'success' });
      } catch (cause) {
        setState({ status: 'error', error: errorFromCause(cause) });
      }
    },
    [fallbackClient, setLocalAuth, tokenStore],
  );

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return { state, submit, reset };
}

function errorFromCause(cause: unknown): DeviceSignInErrorState {
  // Duck-typed instead of `instanceof ApiError` — Vite ESM/CJS module
  // boundaries can give us two `ApiError` class identities (one from
  // @glaon/core/api-client's bundled output, one from the test stub),
  // so the prototype check intermittently fails. The runtime shape is
  // what we actually care about.
  if (cause !== null && typeof cause === 'object' && 'body' in cause) {
    const body = (cause as { body?: { error?: unknown } | null }).body;
    if (body !== null && body !== undefined && typeof body.error === 'string') {
      const code = body.error as DeviceSignInErrorCode;
      return { code, message: messageForCode(code) };
    }
  }
  return { code: 'unknown', message: messageForCode('unknown') };
}

function messageForCode(code: DeviceSignInErrorCode): string {
  switch (code) {
    case 'invalid-credentials':
      return 'Wrong username or password.';
    case 'mfa-required':
      return 'Multi-factor auth is not yet supported in Glaon. Sign in via Home Assistant directly to use this account.';
    case 'invalid-url':
      return 'That Home Assistant URL is not valid.';
    case 'unreachable':
      return "We couldn't reach Home Assistant at that URL.";
    case 'flow-error':
      return 'Home Assistant returned an unexpected response.';
    case 'unknown':
    default:
      return 'Something went wrong while signing in.';
  }
}
