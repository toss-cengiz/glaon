// "Link to cloud" wizard (#354) — drives the device-code flow from the
// signed-in local-mode app. Steps:
//
//   1. Sign in with Clerk (handled outside the wizard; we render a CTA to
//      `/sign-in` if the user lands here unauthenticated).
//   2. POST /pair/initiate → display the 6-digit code with copy.
//   3. Tell the user to enter the code on the addon's `/pair` page; poll
//      GET /pair/status every 2s until claimed / expired / 10-min code TTL.
//   4. Success: confirmation; deep-link "switch to cloud mode" updates the
//      mode-preference and triggers a sign-out of the local session so the
//      mode-selector flips on next reload.
//
// The wizard owns its own minimal state machine; once the apps/api +
// TanStack-Query layer arrive in #392 / #11, this surface gets refactored
// to consume those instead. For now a hand-rolled hook keeps the unit
// tests deterministic and the cloud round-trip mockable.

import { useAuth } from '@clerk/clerk-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { createCloudPairClient, type CloudPairClient, type CloudPairError } from './cloud-api';

const POLL_INTERVAL_MS = 2_000;

type WizardState =
  | { step: 'await-clerk' }
  | { step: 'initiating' }
  | { step: 'awaiting-claim'; code: string; expiresAt: number }
  | { step: 'claimed'; homeId: string }
  | { step: 'expired' }
  | { step: 'error'; error: CloudPairError };

interface PairWizardRouteProps {
  readonly client?: CloudPairClient;
  readonly onCloudReady?: (homeId: string) => void;
}

export function PairWizardRoute({ client, onCloudReady }: PairWizardRouteProps): ReactNode {
  // Clerk's discriminated union — narrow via cast (see #352 bridge for the
  // same workaround). `getToken` returns null when signed out.
  const auth = useAuth() as unknown as {
    isSignedIn?: boolean;
    getToken: () => Promise<string | null>;
  };
  const signedIn = auth.isSignedIn === true;
  const getTokenRef = useRef(auth.getToken);
  useEffect(() => {
    getTokenRef.current = auth.getToken;
  }, [auth.getToken]);
  const cloudClient = useMemo(() => client ?? createCloudPairClient(), [client]);

  const [state, setState] = useState<WizardState>(
    signedIn ? { step: 'initiating' } : { step: 'await-clerk' },
  );

  // Step transition: signed-in but still on await-clerk → initiate.
  useEffect(() => {
    if (signedIn && state.step === 'await-clerk') {
      setState({ step: 'initiating' });
    }
  }, [signedIn, state.step]);

  // Initiate: fetch a fresh code.
  useEffect(() => {
    if (state.step !== 'initiating') return;
    const ctl: { cancelled: boolean } = { cancelled: false };
    void (async () => {
      const token = await getTokenRef.current();
      if (token === null || token.length === 0) {
        if (!ctl.cancelled) setState({ step: 'error', error: { kind: 'unauthorized' } });
        return;
      }
      const result = await cloudClient.initiate(token);
      if (ctl.cancelled) return;
      if (result.ok) {
        setState({
          step: 'awaiting-claim',
          code: result.data.code,
          expiresAt: result.data.expiresAt,
        });
        return;
      }
      setState({ step: 'error', error: result.err });
    })();
    return () => {
      ctl.cancelled = true;
    };
  }, [state.step, cloudClient]);

  // Polling: tick every 2s while we're awaiting a claim. Stops on terminal
  // state (the next render unmounts the interval).
  useEffect(() => {
    if (state.step !== 'awaiting-claim') return;
    const code = state.code;
    const expiresAt = state.expiresAt;
    const ctl: { cancelled: boolean } = { cancelled: false };
    const tick = async (): Promise<void> => {
      if (ctl.cancelled) return;
      if (Date.now() >= expiresAt) {
        setState({ step: 'expired' });
        return;
      }
      const token = await getTokenRef.current();
      if (token === null || token.length === 0) {
        setState({ step: 'error', error: { kind: 'unauthorized' } });
        return;
      }
      const result = await cloudClient.status(token, code);
      // ctl.cancelled flips in the cleanup function below; ESLint's
      // no-unnecessary-condition cannot see closure mutations from the
      // outer cleanup so suppress only the second check (after the await).
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (ctl.cancelled) return;
      if (!result.ok) {
        setState({ step: 'error', error: result.err });
        return;
      }
      if (result.data.status === 'claimed' && typeof result.data.homeId === 'string') {
        setState({ step: 'claimed', homeId: result.data.homeId });
        return;
      }
      if (result.data.status === 'expired') {
        setState({ step: 'expired' });
        return;
      }
    };
    void tick();
    const handle = setInterval(() => {
      void tick();
    }, POLL_INTERVAL_MS);
    return () => {
      ctl.cancelled = true;
      clearInterval(handle);
    };
  }, [state, cloudClient]);

  const restart = useCallback(() => {
    setState({ step: 'initiating' });
  }, []);

  if (!signedIn) {
    return (
      <main data-testid="pair-wizard-await-clerk">
        <h1>Link this home to Glaon cloud</h1>
        <p>You need to sign in with your Glaon account first.</p>
        <a href="/sign-in" data-testid="pair-wizard-sign-in-cta">
          Sign in
        </a>
      </main>
    );
  }

  if (state.step === 'initiating') {
    return (
      <main data-testid="pair-wizard-initiating" aria-busy="true" aria-live="polite">
        <h1>Generating your pairing code…</h1>
      </main>
    );
  }

  if (state.step === 'awaiting-claim') {
    return (
      <main data-testid="pair-wizard-awaiting">
        <h1>Enter this code on your addon</h1>
        <p>
          Open the Glaon addon panel in Home Assistant and choose <em>Link to cloud</em>. Type the
          code below within 10 minutes.
        </p>
        <PairCodeDisplay code={state.code} />
        <p data-testid="pair-wizard-awaiting-hint">
          We&rsquo;ll automatically advance to the next step once the addon accepts the code.
        </p>
      </main>
    );
  }

  if (state.step === 'claimed') {
    return (
      <main data-testid="pair-wizard-claimed">
        <h1>Linked.</h1>
        <p>
          Home <code>{state.homeId}</code> is now reachable through the Glaon cloud relay.
        </p>
        <button
          type="button"
          data-testid="pair-wizard-switch-to-cloud"
          onClick={() => onCloudReady?.(state.homeId)}
        >
          Switch to cloud mode
        </button>
      </main>
    );
  }

  if (state.step === 'expired') {
    return (
      <main data-testid="pair-wizard-expired">
        <h1>That code expired.</h1>
        <p>Pairing codes are valid for 10 minutes.</p>
        <button type="button" data-testid="pair-wizard-restart" onClick={restart}>
          Generate a new code
        </button>
      </main>
    );
  }

  if (state.step === 'error') {
    return (
      <main data-testid="pair-wizard-error" role="alert">
        <h1>{messageFor(state.error)}</h1>
        <button type="button" data-testid="pair-wizard-restart" onClick={restart}>
          Try again
        </button>
      </main>
    );
  }

  // `await-clerk` is handled by the early-return above when `signedIn` is
  // false; once signed in we land in `initiating` via the transition effect.
  // The render returns null for the brief tick between the two.
  return null;
}

function messageFor(err: CloudPairError): string {
  switch (err.kind) {
    case 'unauthorized':
      return 'Your Glaon session expired. Sign in again to continue.';
    case 'rate-limited':
      return err.retryAfterMs !== null
        ? `Too many attempts. Try again in about ${String(Math.ceil(err.retryAfterMs / 1000))} seconds.`
        : 'Too many attempts. Try again in a moment.';
    case 'not-found':
      return 'The pairing code was not found. Try generating a new one.';
    case 'network':
      return 'Could not reach the Glaon cloud. Check your internet connection.';
    case 'unknown':
      return 'Something went wrong on the Glaon cloud side.';
  }
}

interface PairCodeDisplayProps {
  readonly code: string;
}

function PairCodeDisplay({ code }: PairCodeDisplayProps): ReactNode {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(() => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1500);
    });
  }, [code]);
  return (
    <div data-testid="pair-wizard-code">
      <output
        data-testid="pair-wizard-code-value"
        style={{
          display: 'block',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: '2rem',
          letterSpacing: '0.5rem',
          padding: '1rem',
          border: '1px solid #d0d7de',
          borderRadius: '8px',
          textAlign: 'center',
          marginBlock: '1rem',
        }}
      >
        {code}
      </output>
      <button type="button" data-testid="pair-wizard-copy" onClick={onCopy}>
        {copied ? 'Copied' : 'Copy code'}
      </button>
    </div>
  );
}
