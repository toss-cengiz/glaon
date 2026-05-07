// HA OAuth callback handler. Reads `code` + `state` from the URL, validates against the
// pending PKCE flow, exchanges for tokens, and propagates AuthMode to the rest of the app
// via AuthProvider's `setLocalAuth`.

import { useEffect, useRef, useState, type ReactNode } from 'react';

import type { HaConnectionConfig } from '@glaon/core/auth';

import { useAuth } from '../../../auth/auth-provider';
import {
  completeLoginCallback,
  type CompleteLoginCallbackResult,
} from '../../../auth/local-auth-flow';

interface AuthCallbackRouteProps {
  readonly config: HaConnectionConfig;
  readonly redirectUri: string;
  /**
   * Window-location injection for tests. Production passes
   * `() => window.location.search`.
   */
  readonly readSearch?: () => string;
  /**
   * Side-effect after a successful exchange. Production navigates back to "/".
   * Tests pass a spy.
   */
  readonly onSuccess?: () => void;
}

type ViewState =
  | { readonly status: 'pending' }
  | { readonly status: 'success' }
  | {
      readonly status: 'error';
      readonly reason: 'state-mismatch' | 'no-pending-flow' | 'token-exchange-failed';
    };

export function AuthCallbackRoute({
  config,
  redirectUri,
  readSearch,
  onSuccess,
}: AuthCallbackRouteProps): ReactNode {
  const { tokenStore, setLocalAuth } = useAuth();
  const [view, setView] = useState<ViewState>({ status: 'pending' });

  const cancelledRef = useRef(false);
  useEffect(() => {
    cancelledRef.current = false;
    void (async () => {
      const search = readSearch ? readSearch() : window.location.search;
      const params = new URLSearchParams(search);
      const result: CompleteLoginCallbackResult = await completeLoginCallback(
        config,
        redirectUri,
        { code: params.get('code'), state: params.get('state') },
        tokenStore,
      );
      if (cancelledRef.current) return;
      if (result.outcome === 'ok') {
        setLocalAuth(result.tokens);
        setView({ status: 'success' });
        if (onSuccess) onSuccess();
      } else {
        setView({ status: 'error', reason: result.reason });
      }
    })();
    return () => {
      cancelledRef.current = true;
    };
  }, [config, redirectUri, readSearch, onSuccess, tokenStore, setLocalAuth]);

  if (view.status === 'pending') {
    return (
      <main data-testid="auth-callback-pending">
        <p>Completing sign-in…</p>
      </main>
    );
  }
  if (view.status === 'success') {
    return (
      <main data-testid="auth-callback-success">
        <p>Signed in. Redirecting…</p>
      </main>
    );
  }
  return (
    <main data-testid="auth-callback-error">
      <h1>Sign-in failed</h1>
      <p role="alert" data-testid={`auth-callback-error-${view.reason}`}>
        {messageFor(view.reason)}
      </p>
      <a href="/login">Try again</a>
    </main>
  );
}

function messageFor(
  reason: 'state-mismatch' | 'no-pending-flow' | 'token-exchange-failed',
): string {
  switch (reason) {
    case 'state-mismatch':
      return 'The sign-in state did not match. Please start over.';
    case 'no-pending-flow':
      return 'No sign-in flow was in progress. Please start over.';
    case 'token-exchange-failed':
      return 'Home Assistant rejected the sign-in. Please try again.';
  }
}
