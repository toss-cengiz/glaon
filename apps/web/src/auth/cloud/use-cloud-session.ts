// React hook that runs the cloud-session bridge on every Clerk auth state
// change. Components that depend on the cloud session (entity store, relay
// client) read the slot via `useAuth()` once #353 wires the AuthMode flip.

import { useAuth } from '@clerk/clerk-react';
import { useEffect } from 'react';

import type { TokenStore } from '@glaon/core/auth';

import { syncCloudSession } from './cloud-session-bridge';

export function useCloudSessionSync(store: TokenStore): void {
  // Clerk's `useAuth()` returns a discriminated union whose default branch
  // types `isSignedIn` as `false | undefined`. ESLint's strict
  // no-unnecessary-condition rule then flags any boolean check on it as
  // "always falsy". Cast through `unknown` so the bridge sees a plain
  // boolean — the runtime value can still be `true` once the user signs in.
  const auth = useAuth() as unknown as {
    isSignedIn?: boolean;
    getToken: () => Promise<string | null>;
  };
  const signedIn = auth.isSignedIn === true;
  const { getToken } = auth;
  useEffect(() => {
    const ctl = { cancelled: false };
    void (async () => {
      const result = await syncCloudSession(
        {
          isSignedIn: signedIn,
          getToken: () => getToken(),
        },
        store,
      );
      if (ctl.cancelled) return;
      // Result is currently observable only via the TokenStore slot; the
      // entity store will read this once #10 wires the cloud transport.
      void result;
    })();
    return () => {
      ctl.cancelled = true;
    };
  }, [signedIn, getToken, store]);
}
