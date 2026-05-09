// E2E-only stub for `@clerk/clerk-react` (#359). Vite aliases the real
// SDK to this module when `VITE_E2E_AUTH_STUB=true` so the Playwright
// pairing smoke can drive the wizard without hitting Clerk's real
// network. The stub returns a deterministic signed-in session.
//
// Production builds MUST NOT alias to this file — the build env in
// `apps/web/vite.config.ts` only applies the alias when the flag is
// `true`. The `__e2e-stubs__` prefix on the path keeps the file out of
// any visual pattern that production code might import by accident.

import type { ReactNode } from 'react';

// Low-entropy three-segment placeholder. The cloud-session bridge's JWT
// decoder treats unparseable segments as `exp=0` (i.e. expired), which
// is fine for the smoke — the wizard's own polling timer drives the
// flow, not the cloud-session expiry.
const STUB_TOKEN = 'aaaaaa.bbbbbb.cccccc';

const stubAuth = {
  isSignedIn: true,
  isLoaded: true,
  userId: 'user_stub',
  sessionId: 'sess_stub',
  getToken: () => Promise.resolve(STUB_TOKEN),
};

const stubSignIn = {
  signIn: {
    create: () =>
      Promise.resolve({
        status: 'complete' as const,
        createdSessionId: 'sess_stub',
      }),
  },
  setActive: () => Promise.resolve(),
  isLoaded: true,
};

const stubSignUp = {
  signUp: {
    create: () => Promise.resolve(),
    prepareEmailAddressVerification: () => Promise.resolve(),
    attemptEmailAddressVerification: () =>
      Promise.resolve({
        status: 'complete' as const,
        createdSessionId: 'sess_stub',
      }),
  },
  setActive: () => Promise.resolve(),
  isLoaded: true,
};

export function ClerkProvider({ children }: { children: ReactNode }): ReactNode {
  return <>{children}</>;
}

export function useAuth(): typeof stubAuth {
  return stubAuth;
}

export function useSignIn(): typeof stubSignIn {
  return stubSignIn;
}

export function useSignUp(): typeof stubSignUp {
  return stubSignUp;
}

export function SignIn(): ReactNode {
  return <div data-testid="stub-sign-in">stub sign-in</div>;
}

export function SignUp(): ReactNode {
  return <div data-testid="stub-sign-up">stub sign-up</div>;
}
