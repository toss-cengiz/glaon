// Singleton ApiClient for the web app. Reads the apps/api base URL
// from `VITE_API_BASE_URL` (defaults to the local dev server) and
// passes through the in-memory session JWT from the AuthProvider's
// TokenStore. The client itself is stateless — feature code calls it
// via `useApiClient()` so the AuthProvider's token rotation takes
// effect on the next request without re-creating the singleton.
//
// This is intentionally minimal: we don't ship TanStack Query in
// apps/web yet, so the Login screen drives mutations with plain
// `useState` + `async`. When TanStack lands (#420 layouts is the
// natural first consumer), the singleton stays the same.

import { ApiClient } from '@glaon/core/api-client';

import type { TokenStore } from '@glaon/core/auth';

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export function createApiClient(tokenStore: TokenStore): ApiClient {
  return new ApiClient({
    baseUrl: API_BASE_URL,
    getSessionJwt: async () => {
      const slot = await tokenStore.get('cloud-session');
      return slot?.token ?? null;
    },
  });
}
