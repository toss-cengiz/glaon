// Zod schemas shared between `apps/api` (server) and `apps/web` +
// `apps/mobile` (clients) — issue #419 / ADR 0025. Single source of
// truth: server validates request bodies + persisted documents +
// response shapes through the same definitions the client uses to
// type-check its calls.
//
// `@glaon/core` stays platform-agnostic per ADR 0004; the schemas use
// only Zod + plain JS values. No DOM, no react-native, no Node-only
// modules sneak in via this file.

import { z } from 'zod';

/* -------- /auth/exchange -------------------------------------------------- */

export const AuthExchangeRequestSchema = z.object({
  haAccessToken: z.string().min(1),
  haBaseUrl: z.string().url(),
});
export type AuthExchangeRequest = z.infer<typeof AuthExchangeRequestSchema>;

export const AuthExchangeResponseSchema = z.object({
  sessionJwt: z.string().min(1),
  /** ms-since-epoch, mirrors `claims.exp * 1000` */
  expiresAt: z.number().int().positive(),
});
export type AuthExchangeResponse = z.infer<typeof AuthExchangeResponseSchema>;

/* -------- /auth/refresh --------------------------------------------------- */

export const AuthRefreshRequestSchema = z.object({
  sessionJwt: z.string().min(1),
});
export type AuthRefreshRequest = z.infer<typeof AuthRefreshRequestSchema>;

// The /auth/refresh response shape is identical to /auth/exchange — the
// server re-mints a session JWT with a fresh exp. Callers consume
// AuthExchangeResponseSchema for both endpoints; we expose a type
// alias here so the API surface reads cleanly at call sites.
export type AuthRefreshResponse = AuthExchangeResponse;

/* -------- /auth/logout ---------------------------------------------------- */

export const AuthLogoutResponseSchema = z.object({
  ok: z.literal(true),
});
export type AuthLogoutResponse = z.infer<typeof AuthLogoutResponseSchema>;

/* -------- shared error envelope ------------------------------------------- */

export const ApiErrorBodySchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  retryAfterMs: z.number().int().nonnegative().optional(),
});
export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;

/* -------- session JWT decode (client-side; verification stays server) ----- */

/** Claims the apps/api server stamps on the session JWT (#418). */
export const SessionClaimsSchema = z.object({
  sub: z.string().min(1),
  jti: z.string().min(1),
  iat: z.number().int().nonnegative(),
  exp: z.number().int().nonnegative(),
});
export type SessionClaims = z.infer<typeof SessionClaimsSchema>;
