// Bridges Clerk's session token into Glaon's TokenStore `cloud-session` slot
// (#352). Pure functions live here so the React hook can stay dumb and the
// logic can be unit-tested without rendering Clerk.
//
// `expiresAt` derivation: Clerk's `getToken()` returns a JWT whose `exp`
// claim is in seconds since epoch. We decode the payload (no verification —
// Clerk verifies on its own servers; cloud-side verifies on `apps/cloud`)
// to extract `exp` for the slot's `expiresAt` (ms-since-epoch). If the token
// has no `exp` we conservatively treat it as already expired, which forces
// a fresh getToken on the next read.

import type { TokenStore } from '@glaon/core/auth';

export interface ClerkLikeAuth {
  readonly isSignedIn: boolean;
  readonly getToken: () => Promise<string | null>;
}

export async function syncCloudSession(
  auth: ClerkLikeAuth,
  store: TokenStore,
): Promise<{ written: boolean }> {
  if (!auth.isSignedIn) {
    await store.clear('cloud-session');
    return { written: false };
  }
  const token = await auth.getToken();
  if (token === null || token.length === 0) {
    await store.clear('cloud-session');
    return { written: false };
  }
  const expiresAt = decodeJwtExp(token);
  await store.set({ kind: 'cloud-session', token, expiresAt });
  return { written: true };
}

export function decodeJwtExp(token: string): number {
  const parts = token.split('.');
  if (parts.length !== 3) return 0;
  const payload = parts[1];
  if (payload === undefined || payload.length === 0) return 0;
  try {
    const json = atob(base64UrlToBase64(payload));
    const parsed = JSON.parse(json) as { exp?: unknown };
    if (typeof parsed.exp !== 'number' || !Number.isFinite(parsed.exp)) return 0;
    return parsed.exp * 1000;
  } catch {
    return 0;
  }
}

function base64UrlToBase64(value: string): string {
  let normal = value.replace(/-/g, '+').replace(/_/g, '/');
  while (normal.length % 4 !== 0) normal += '=';
  return normal;
}
