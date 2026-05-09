// React hook that runs the cloud-session bridge on every Clerk auth state
// change. Mounted under <CloudAuthProvider>, so reading Clerk hooks is safe.

import { useAuth } from '@clerk/clerk-expo';
import { useEffect } from 'react';

import type { TokenStore } from '@glaon/core/auth';

import { syncCloudSession } from './cloud-session-bridge';

export function useCloudSessionSync(store: TokenStore): void {
  // Same discriminated-union narrowing workaround as the web bridge — see
  // `apps/web/src/auth/cloud/use-cloud-session.ts` for the rationale.
  const auth = useAuth() as unknown as {
    isSignedIn?: boolean;
    getToken: () => Promise<string | null>;
  };
  const signedIn = auth.isSignedIn === true;
  const { getToken } = auth;

  useEffect(() => {
    const ctl: { cancelled: boolean } = { cancelled: false };
    void (async () => {
      const result = await syncCloudSession(
        {
          isSignedIn: signedIn,
          getToken: () => getToken(),
        },
        store,
      );
      if (ctl.cancelled) return;
      void result;
    })();
    return () => {
      ctl.cancelled = true;
    };
  }, [signedIn, getToken, store]);
}
