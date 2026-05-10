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

/* -------- /auth/ha/password-grant ----------------------------------------- */
//
// The Device-mode login proxy (#468 / ADR 0027). The web + mobile client
// renders Glaon's own username/password form, posts the credentials to
// `apps/api`, and `apps/api` drives HA's `/auth/login_flow` API on the
// caller's behalf. The end user never sees HA's redirect UI.
//
// Server is a stateless proxy: HA refresh token is NOT persisted in the
// cloud database — it is returned in the response so the client writes
// it to its `local` slot group exactly the way the OAuth redirect flow
// would.

export const HaPasswordGrantRequestSchema = z.object({
  haBaseUrl: z.string().url(),
  username: z.string().min(1),
  password: z.string().min(1),
  /** HA requires a URL-shaped client_id whose host matches the redirect.
   * Web sends `${origin}/`, mobile sends its deep-link scheme + `/auth`. */
  clientId: z.string().min(1),
});
export type HaPasswordGrantRequest = z.infer<typeof HaPasswordGrantRequestSchema>;

export const HaAccessBundleSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  /** seconds; HA returns this as `expires_in`. */
  expiresIn: z.number().int().positive(),
  tokenType: z.literal('Bearer'),
});
export type HaAccessBundle = z.infer<typeof HaAccessBundleSchema>;

export const HaPasswordGrantResponseSchema = z.object({
  haAccess: HaAccessBundleSchema,
  sessionJwt: z.string().min(1),
  /** ms-since-epoch, mirrors `claims.exp * 1000`. */
  expiresAt: z.number().int().positive(),
});
export type HaPasswordGrantResponse = z.infer<typeof HaPasswordGrantResponseSchema>;

/**
 * Discriminator for the error envelope of `/auth/ha/password-grant`.
 * The client uses this to decide UX: `mfa-required` shows the
 * "sign in via HA directly" inline message, `invalid-credentials`
 * surfaces a normal form error, and the rest map to a generic
 * "couldn't reach Home Assistant" banner.
 */
export const HaPasswordGrantErrorCode = z.enum([
  'invalid-url',
  'invalid-credentials',
  'mfa-required',
  'unreachable',
  'flow-error',
]);
export type HaPasswordGrantErrorCode = z.infer<typeof HaPasswordGrantErrorCode>;

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
