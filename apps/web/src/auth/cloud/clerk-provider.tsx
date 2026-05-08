// CloudAuthProvider — wraps `<ClerkProvider>` for Glaon's cloud-mode subtree
// (#352). The provider lives only inside the cloud branch of the app router
// (the local-mode path bypasses Clerk entirely per ADR 0017). Mode detection
// (#353) decides which branch to render.
//
// Publishable key is read from `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY`.
// `getClerkPublishableKey()` is exported separately so the App shell can
// decide whether to mount the provider at all — local-mode-only builds and
// unit tests with no env need no Clerk context, and asking ClerkProvider to
// initialize without a key crashes hard at import time.

import { ClerkProvider } from '@clerk/clerk-react';
import type { ReactNode } from 'react';

const PUBLISHABLE_KEY: string | undefined = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function getClerkPublishableKey(): string | null {
  if (PUBLISHABLE_KEY === undefined || PUBLISHABLE_KEY.length === 0) return null;
  return PUBLISHABLE_KEY;
}

interface CloudAuthProviderProps {
  readonly publishableKey: string;
  readonly children: ReactNode;
}

export function CloudAuthProvider({ publishableKey, children }: CloudAuthProviderProps): ReactNode {
  return <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>;
}
