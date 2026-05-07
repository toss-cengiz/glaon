// Local-mode login entry point. Renders a "Sign in with Home Assistant" button; clicking it
// starts the PKCE redirect flow.

import { useState, type ReactNode } from 'react';

import type { HaConnectionConfig } from '@glaon/core/auth';

import { startLoginRedirect } from '../../../auth/local-auth-flow';

interface LoginRouteProps {
  readonly config: HaConnectionConfig;
  readonly redirectUri: string;
  /**
   * Navigation injection — defaults to `window.location.assign`. Tests pass a spy to assert
   * the redirect target without actually navigating jsdom.
   */
  readonly navigate?: (url: string) => void;
}

export function LoginRoute({ config, redirectUri, navigate }: LoginRouteProps): ReactNode {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const onSignIn = async (): Promise<void> => {
    setError(null);
    setIsStarting(true);
    try {
      const result = await startLoginRedirect(config, redirectUri);
      const go =
        navigate ??
        ((url: string) => {
          window.location.assign(url);
        });
      go(result.redirectUrl);
    } catch (cause) {
      setIsStarting(false);
      setError(cause instanceof Error ? cause.message : 'Login could not be started.');
    }
  };

  return (
    <main data-testid="login-route">
      <h1>Glaon</h1>
      <p>Sign in with your Home Assistant account to continue.</p>
      <button
        type="button"
        data-testid="login-start"
        disabled={isStarting}
        onClick={() => {
          void onSignIn();
        }}
      >
        {isStarting ? 'Redirecting…' : 'Sign in with Home Assistant'}
      </button>
      {error !== null && (
        <p role="alert" data-testid="login-error">
          {error}
        </p>
      )}
    </main>
  );
}
