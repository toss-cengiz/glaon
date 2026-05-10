// Typed REST client over `apps/api`. The same Zod schemas the server
// validates against are reused here for request + response parsing —
// schema drift between server and client is an impossibility unless the
// schema definition itself changes.
//
// Lifecycle decisions kept simple per #419 acceptance:
//   - No retry / backoff in this layer; feature code wraps with TanStack
//     Query (web/mobile) which owns retry policy.
//   - No automatic refresh on 401; the AuthProvider handles that path.
//   - No timeout in this layer; callers pass an `AbortSignal` if they want
//     one (TanStack Query does this by default).

import type { z } from 'zod';

import { ApiError, ApiNetworkError } from './errors';
import {
  CreateLayoutRequestSchema,
  LayoutListResponseSchema,
  LayoutSchema,
  UpdateLayoutRequestSchema,
  type CreateLayoutRequest,
  type Layout,
  type LayoutListQuery,
  type LayoutListResponse,
  type UpdateLayoutRequest,
} from './layouts';
import {
  ApiErrorBodySchema,
  AuthExchangeRequestSchema,
  AuthExchangeResponseSchema,
  AuthLogoutResponseSchema,
  AuthRefreshRequestSchema,
  HaPasswordGrantRequestSchema,
  HaPasswordGrantResponseSchema,
  type AuthExchangeRequest,
  type AuthExchangeResponse,
  type AuthLogoutResponse,
  type AuthRefreshRequest,
  type AuthRefreshResponse,
  type HaPasswordGrantRequest,
  type HaPasswordGrantResponse,
} from './schemas';

export interface ApiClientOptions {
  readonly baseUrl: string;
  /**
   * Returns the current session JWT (or `null` for unauthenticated calls
   * like `/auth/exchange`). The client calls this on every request so
   * token rotation in the AuthProvider takes effect without re-creating
   * the client.
   */
  readonly getSessionJwt?: () => string | null | Promise<string | null>;
  readonly fetchImpl?: typeof fetch;
}

interface RequestOptions {
  readonly signal?: AbortSignal;
  readonly skipAuth?: boolean;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly getSessionJwt: () => string | null | Promise<string | null>;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ApiClientOptions) {
    this.baseUrl = stripTrailingSlash(options.baseUrl);
    this.getSessionJwt = options.getSessionJwt ?? (() => null);
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async exchange(
    body: AuthExchangeRequest,
    options: RequestOptions = {},
  ): Promise<AuthExchangeResponse> {
    const parsed = AuthExchangeRequestSchema.parse(body);
    return this.send('POST', '/auth/exchange', parsed, AuthExchangeResponseSchema, {
      ...options,
      skipAuth: true,
    });
  }

  async refresh(
    body: AuthRefreshRequest,
    options: RequestOptions = {},
  ): Promise<AuthRefreshResponse> {
    const parsed = AuthRefreshRequestSchema.parse(body);
    // /auth/refresh response shape is identical to /auth/exchange.
    return this.send('POST', '/auth/refresh', parsed, AuthExchangeResponseSchema, {
      ...options,
      skipAuth: true,
    });
  }

  async logout(options: RequestOptions = {}): Promise<AuthLogoutResponse> {
    return this.send('POST', '/auth/logout', null, AuthLogoutResponseSchema, options);
  }

  /**
   * Device-mode login proxy (#468 / ADR 0027). Posts the user's HA
   * credentials to `apps/api`, which drives `/auth/login_flow` on their
   * HA installation and returns the resulting access + refresh tokens
   * plus a Glaon session JWT. Used by the Login screen's Device tab so
   * the end user never sees HA's redirect UI.
   *
   * Errors are surfaced as `ApiError`. Notable bodies:
   *  - `{ error: 'mfa-required' }` (502) — HA prompted a 2FA step;
   *    the UI should show a "sign in via HA directly" inline message.
   *  - `{ error: 'invalid-credentials' }` (401) — bad username/password.
   *  - `{ error: 'unreachable' }` (502) — HA didn't respond.
   */
  async haPasswordGrant(
    body: HaPasswordGrantRequest,
    options: RequestOptions = {},
  ): Promise<HaPasswordGrantResponse> {
    const parsed = HaPasswordGrantRequestSchema.parse(body);
    return this.send('POST', '/auth/ha/password-grant', parsed, HaPasswordGrantResponseSchema, {
      ...options,
      skipAuth: true,
    });
  }

  /* -------- /layouts (#420) ------------------------------------------- */

  async listLayouts(
    query: LayoutListQuery = {},
    options: RequestOptions = {},
  ): Promise<LayoutListResponse> {
    const path =
      query.homeId !== undefined && query.homeId.length > 0
        ? `/layouts?homeId=${encodeURIComponent(query.homeId)}`
        : '/layouts';
    return this.send('GET', path, null, LayoutListResponseSchema, options);
  }

  async getLayout(id: string, options: RequestOptions = {}): Promise<Layout> {
    return this.send('GET', `/layouts/${encodeURIComponent(id)}`, null, LayoutSchema, options);
  }

  async createLayout(body: CreateLayoutRequest, options: RequestOptions = {}): Promise<Layout> {
    const parsed = CreateLayoutRequestSchema.parse(body);
    return this.send('POST', '/layouts', parsed, LayoutSchema, options);
  }

  async updateLayout(
    id: string,
    body: UpdateLayoutRequest,
    options: RequestOptions = {},
  ): Promise<Layout> {
    const parsed = UpdateLayoutRequestSchema.parse(body);
    return this.send('PUT', `/layouts/${encodeURIComponent(id)}`, parsed, LayoutSchema, options);
  }

  async deleteLayout(id: string, options: RequestOptions = {}): Promise<void> {
    await this.sendNoContent('DELETE', `/layouts/${encodeURIComponent(id)}`, null, options);
  }

  // The send() helper is `protected` so feature-specific subclasses (or
  // ad-hoc extensions in @glaon/core later) can add domain endpoints
  // without re-implementing the auth + parse + error pipeline.
  protected async send<TResponse>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body: unknown,
    responseSchema: z.ZodType<TResponse>,
    options: RequestOptions,
  ): Promise<TResponse> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (body !== null) {
      headers['Content-Type'] = 'application/json';
    }
    if (options.skipAuth !== true) {
      const token = await this.getSessionJwt();
      if (token !== null && token.length > 0) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const init: RequestInit = {
      method,
      headers,
      ...(body !== null ? { body: JSON.stringify(body) } : {}),
      ...(options.signal !== undefined ? { signal: options.signal } : {}),
    };

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, init);
    } catch (cause) {
      throw new ApiNetworkError(`apps/api ${method} ${path} failed`, cause);
    }

    const text = await response.text();
    let parsedBody: unknown = null;
    if (text.length > 0) {
      try {
        parsedBody = JSON.parse(text);
      } catch {
        /* tolerate non-JSON body — falls into ApiError unknown branch */
      }
    }

    if (!response.ok) {
      const errorBody = ApiErrorBodySchema.safeParse(parsedBody);
      throw new ApiError(
        `apps/api ${method} ${path} returned ${String(response.status)}`,
        response.status,
        errorBody.success ? errorBody.data : null,
      );
    }
    return responseSchema.parse(parsedBody);
  }

  // Same pipeline as send() but for endpoints that respond 204 No
  // Content (DELETE /layouts/:id). We don't try to JSON-parse the body
  // and we tolerate any 2xx status.
  protected async sendNoContent(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body: unknown,
    options: RequestOptions,
  ): Promise<void> {
    const headers: Record<string, string> = {};
    if (body !== null) {
      headers['Content-Type'] = 'application/json';
    }
    if (options.skipAuth !== true) {
      const token = await this.getSessionJwt();
      if (token !== null && token.length > 0) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const init: RequestInit = {
      method,
      headers,
      ...(body !== null ? { body: JSON.stringify(body) } : {}),
      ...(options.signal !== undefined ? { signal: options.signal } : {}),
    };

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, init);
    } catch (cause) {
      throw new ApiNetworkError(`apps/api ${method} ${path} failed`, cause);
    }
    if (!response.ok) {
      const text = await response.text();
      let parsedBody: unknown = null;
      if (text.length > 0) {
        try {
          parsedBody = JSON.parse(text);
        } catch {
          /* ignore */
        }
      }
      const errorBody = ApiErrorBodySchema.safeParse(parsedBody);
      throw new ApiError(
        `apps/api ${method} ${path} returned ${String(response.status)}`,
        response.status,
        errorBody.success ? errorBody.data : null,
      );
    }
  }
}

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}
