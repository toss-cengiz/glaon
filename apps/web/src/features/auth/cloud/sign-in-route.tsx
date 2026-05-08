// Cloud-mode sign-in landing — wraps Clerk's <SignIn> component with
// Glaon-friendly redirect URLs and a `data-testid` envelope so the F1
// cloud-mode smoke (#358) can locate the form deterministically.

import { SignIn } from '@clerk/clerk-react';
import type { ReactNode } from 'react';

interface SignInRouteProps {
  readonly redirectUrl?: string;
  readonly signUpUrl?: string;
}

export function SignInRoute({
  redirectUrl = '/',
  signUpUrl = '/sign-up',
}: SignInRouteProps): ReactNode {
  return (
    <main data-testid="cloud-sign-in-route">
      <h1>Sign in to Glaon</h1>
      <SignIn
        forceRedirectUrl={redirectUrl}
        signUpUrl={signUpUrl}
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
