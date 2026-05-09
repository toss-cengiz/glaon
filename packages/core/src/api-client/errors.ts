// Typed errors thrown by `ApiClient`. The class hierarchy is shallow on
// purpose — callers usually only need to know "did the request succeed",
// "did the server reject it" (4xx with parsed body), or "did something
// go wrong on the way" (network / timeout / non-JSON response).

import type { ApiErrorBody } from './schemas';

export class ApiError extends Error {
  /** HTTP status code returned by `apps/api`. */
  readonly status: number;
  /** Parsed `{ error, code?, retryAfterMs? }` body when the response was JSON. */
  readonly body: ApiErrorBody | null;

  constructor(message: string, status: number, body: ApiErrorBody | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * `fetch` rejected (DNS failure, abort, TLS error) before the server
 * could respond. Distinct from `ApiError` so retry policies can target
 * transient transport faults specifically.
 */
export class ApiNetworkError extends Error {
  override readonly cause: unknown;

  constructor(message: string, cause: unknown) {
    super(message);
    this.name = 'ApiNetworkError';
    this.cause = cause;
  }
}
