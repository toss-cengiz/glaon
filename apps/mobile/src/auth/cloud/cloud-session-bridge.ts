// Bridges Clerk's session token into Glaon's mobile TokenStore
// `cloud-session` slot (#355). Mirrors the web bridge in
// `apps/web/src/auth/cloud/cloud-session-bridge.ts`; the helper takes a
// `ClerkLikeAuth` interface so the same logic could later move to
// `@glaon/core/auth` and be shared. For now we keep it co-located with
// the platform-specific hook that consumes it.

import type { TokenStore } from '@glaon/core/auth';

interface ClerkLikeAuth {
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

function decodeJwtExp(token: string): number {
  const parts = token.split('.');
  if (parts.length !== 3) return 0;
  const payload = parts[1];
  if (payload === undefined || payload.length === 0) return 0;
  try {
    const json = base64UrlDecode(payload);
    const parsed = JSON.parse(json) as { exp?: unknown };
    if (typeof parsed.exp !== 'number' || !Number.isFinite(parsed.exp)) return 0;
    return parsed.exp * 1000;
  } catch {
    return 0;
  }
}

function base64UrlDecode(value: string): string {
  let normal = value.replace(/-/g, '+').replace(/_/g, '/');
  while (normal.length % 4 !== 0) normal += '=';
  // React Native (Hermes / JSC) exposes `atob` via the URL/globals
  // polyfills shipped with Expo SDK 55; the JWT is base64url and never
  // contains binary, so atob suffices.
  return atob(normal);
}
