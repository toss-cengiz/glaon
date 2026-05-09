import { describe, expect, it } from 'vitest';

import {
  ApiErrorBodySchema,
  AuthExchangeRequestSchema,
  AuthExchangeResponseSchema,
  AuthLogoutResponseSchema,
  AuthRefreshRequestSchema,
  SessionClaimsSchema,
} from './schemas';

describe('AuthExchangeRequestSchema', () => {
  it('accepts a well-formed request', () => {
    expect(
      AuthExchangeRequestSchema.parse({
        haAccessToken: 'tok',
        haBaseUrl: 'http://homeassistant.local:8123',
      }),
    ).toEqual({ haAccessToken: 'tok', haBaseUrl: 'http://homeassistant.local:8123' });
  });

  it('rejects an empty haAccessToken', () => {
    expect(
      AuthExchangeRequestSchema.safeParse({ haAccessToken: '', haBaseUrl: 'http://h' }).success,
    ).toBe(false);
  });

  it('rejects a non-URL haBaseUrl', () => {
    expect(
      AuthExchangeRequestSchema.safeParse({ haAccessToken: 'x', haBaseUrl: 'not-a-url' }).success,
    ).toBe(false);
  });
});

describe('AuthExchangeResponseSchema', () => {
  it('round-trips the server response shape', () => {
    const data = { sessionJwt: 'a.b.c', expiresAt: 1_700_000_000_000 };
    expect(AuthExchangeResponseSchema.parse(data)).toEqual(data);
  });

  it('rejects negative expiresAt', () => {
    expect(AuthExchangeResponseSchema.safeParse({ sessionJwt: 'x', expiresAt: -1 }).success).toBe(
      false,
    );
  });
});

describe('AuthRefreshRequestSchema', () => {
  it('requires a non-empty sessionJwt', () => {
    expect(AuthRefreshRequestSchema.safeParse({ sessionJwt: '' }).success).toBe(false);
    expect(AuthRefreshRequestSchema.safeParse({ sessionJwt: 'x' }).success).toBe(true);
  });
});

describe('AuthLogoutResponseSchema', () => {
  it('only matches { ok: true }', () => {
    expect(AuthLogoutResponseSchema.safeParse({ ok: true }).success).toBe(true);
    expect(AuthLogoutResponseSchema.safeParse({ ok: false }).success).toBe(false);
  });
});

describe('ApiErrorBodySchema', () => {
  it('parses a minimal error envelope', () => {
    expect(ApiErrorBodySchema.parse({ error: 'unauthorized' })).toEqual({ error: 'unauthorized' });
  });

  it('parses the full error envelope with retry hint', () => {
    const data = { error: 'rate-limited', code: 'too-many', retryAfterMs: 30_000 };
    expect(ApiErrorBodySchema.parse(data)).toEqual(data);
  });

  it('rejects negative retryAfterMs', () => {
    expect(ApiErrorBodySchema.safeParse({ error: 'x', retryAfterMs: -1 }).success).toBe(false);
  });
});

describe('SessionClaimsSchema', () => {
  it('round-trips canonical claims', () => {
    const claims = { sub: 'u', jti: 'j', iat: 1, exp: 2 };
    expect(SessionClaimsSchema.parse(claims)).toEqual(claims);
  });

  it('rejects non-integer exp', () => {
    expect(SessionClaimsSchema.safeParse({ sub: 'u', jti: 'j', iat: 1, exp: 1.5 }).success).toBe(
      false,
    );
  });
});
