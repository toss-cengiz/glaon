// Mobile mirror of `apps/web/src/auth/cloud/clerk-provider.tsx` (#352).
// Mounts Clerk's Expo provider only when EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
// is configured — Clerk's SDK throws on import-time when given an empty
// key, so local-mode-only builds skip the provider entirely. Mode-detect
// (#356) will narrow the scope further once it lands.

import { ClerkProvider } from '@clerk/clerk-expo';
import type { ReactNode } from 'react';

import { expoTokenCache } from './token-cache';

const PUBLISHABLE_KEY: string | undefined = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function getClerkPublishableKey(): string | null {
  if (PUBLISHABLE_KEY === undefined || PUBLISHABLE_KEY.length === 0) return null;
  return PUBLISHABLE_KEY;
}

interface CloudAuthProviderProps {
  readonly publishableKey: string;
  readonly children: ReactNode;
}

export function CloudAuthProvider({ publishableKey, children }: CloudAuthProviderProps): ReactNode {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={expoTokenCache}>
      {children}
    </ClerkProvider>
  );
}
