// Cloud-mode sign-up landing — Clerk's <SignUp> wrapped to mirror the
// `<SignInRoute>` layout. F1 smoke (#358) does not currently exercise this
// path, but the route exists so users with a Clerk publishable key can
// self-serve registration in dev / preview.

import { SignUp } from '@clerk/clerk-react';
import type { ReactNode } from 'react';

interface SignUpRouteProps {
  readonly redirectUrl?: string;
  readonly signInUrl?: string;
}

export function SignUpRoute({
  redirectUrl = '/',
  signInUrl = '/sign-in',
}: SignUpRouteProps): ReactNode {
  return (
    <main data-testid="cloud-sign-up-route">
      <h1>Create your Glaon account</h1>
      <SignUp
        forceRedirectUrl={redirectUrl}
        signInUrl={signInUrl}
        appearance={{
          elements: {
            rootBox: 'glaon-clerk-root',
            card: 'glaon-clerk-card',
          },
        }}
      />
    </main>
  );
}
