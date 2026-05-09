// Public surface of @glaon/core/api-client. Both apps/web and apps/mobile
// consume it for typed calls into apps/api; apps/api re-exports the
// schemas from `apps/api/src/schemas.ts` so the server validates with
// the same Zod definitions the clients build their requests against.

export { ApiClient } from './client';
export type { ApiClientOptions } from './client';
export { ApiError, ApiNetworkError } from './errors';
export {
  ApiErrorBodySchema,
  AuthExchangeRequestSchema,
  AuthExchangeResponseSchema,
  AuthLogoutResponseSchema,
  AuthRefreshRequestSchema,
  SessionClaimsSchema,
  type ApiErrorBody,
  type AuthExchangeRequest,
  type AuthExchangeResponse,
  type AuthLogoutResponse,
  type AuthRefreshRequest,
  type AuthRefreshResponse,
  type SessionClaims,
} from './schemas';
