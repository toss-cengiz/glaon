import { describe, expect, it, vi } from 'vitest';

import { decodeSecret, mintSessionJwt, verifySessionJwt } from '../auth/jwt';
import { InMemoryRevocationStore } from '../auth/revocation';
import { createAuthRouter } from './auth';

const SECRET = decodeSecret('a'.repeat(32));

function makeFetch(
  responder: (input: string, init?: RequestInit) => Response | Promise<Response>,
): typeof fetch {
  const impl = vi.fn(async (input: string, init?: RequestInit) => responder(input, init));
  return impl as unknown as typeof fetch;
}

function makeRouter(overrides: { fetchImpl?: typeof fetch; webOrigins?: string[] } = {}) {
  const revocations = new InMemoryRevocationStore();
  const router = createAuthRouter({
    secret: SECRET,
    revocations,
    webOrigins: overrides.webOrigins ?? [],
    sessionTtlSeconds: 60,
    ...(overrides.fetchImpl !== undefined ? { fetchImpl: overrides.fetchImpl } : {}),
  });
  return { router, revocations };
}

describe('POST /auth/exchange', () => {
  it('returns a session JWT after a successful HA introspection', async () => {
    const fetchImpl = makeFetch(() => Promise.resolve(new Response('{}', { status: 200 })));
    const { router } = makeRouter({ fetchImpl });
    const res = await router.request('/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        haAccessToken: 'dummy-token',
        haBaseUrl: 'http://homeassistant.local:8123',
      }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { sessionJwt: string; expiresAt: number };
    expect(typeof body.sessionJwt).toBe('string');
    expect(body.expiresAt).toBeGreaterThan(Date.now());
    const claims = await verifySessionJwt(SECRET, body.sessionJwt);
    expect(claims).not.toBeNull();
  });

  it('rejects an invalid request body with 400', async () => {
    const { router } = makeRouter();
    const res = await router.request('/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"missing":"fields"}',
    });
    expect(res.status).toBe(400);
  });

  it('returns 401 when HA introspection rejects the token', async () => {
    const fetchImpl = makeFetch(() => Promise.resolve(new Response('', { status: 401 })));
    const { router } = makeRouter({ fetchImpl });
    const res = await router.request('/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ haAccessToken: 'bad', haBaseUrl: 'http://h:8123' }),
    });
    expect(res.status).toBe(401);
  });

  it('sets an httpOnly Secure cookie when Origin matches the allowlist', async () => {
    const fetchImpl = makeFetch(() => Promise.resolve(new Response('{}', { status: 200 })));
    const { router } = makeRouter({
      fetchImpl,
      webOrigins: ['https://app.glaon.com'],
    });
    const res = await router.request('/exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://app.glaon.com',
      },
      body: JSON.stringify({ haAccessToken: 'x', haBaseUrl: 'http://h:8123' }),
    });
    expect(res.status).toBe(200);
    const cookie = res.headers.get('Set-Cookie');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Strict');
  });

  it('does not set a cookie for non-allowlisted origins (mobile path)', async () => {
    const fetchImpl = makeFetch(() => Promise.resolve(new Response('{}', { status: 200 })));
    const { router } = makeRouter({
      fetchImpl,
      webOrigins: ['https://app.glaon.com'],
    });
    const res = await router.request('/exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:5173',
      },
      body: JSON.stringify({ haAccessToken: 'x', haBaseUrl: 'http://h:8123' }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Set-Cookie')).toBeNull();
  });
});

describe('POST /auth/refresh', () => {
  it('mints a fresh JWT for a valid session', async () => {
    const { router } = makeRouter();
    const { jwt } = await mintSessionJwt(SECRET, { userId: 'u-1', ttlSeconds: 60 });
    const res = await router.request('/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionJwt: jwt }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { sessionJwt: string };
    expect(body.sessionJwt).not.toBe(jwt);
  });

  it('rejects a revoked session', async () => {
    const { router, revocations } = makeRouter();
    const { jwt, claims } = await mintSessionJwt(SECRET, { userId: 'u-1', ttlSeconds: 60 });
    await revocations.revoke(claims.jti, 'u-1', claims.exp);
    const res = await router.request('/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionJwt: jwt }),
    });
    expect(res.status).toBe(401);
  });

  it('rejects a tampered session JWT', async () => {
    const { router } = makeRouter();
    const res = await router.request('/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionJwt: 'not-a-jwt' }),
    });
    expect(res.status).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  it('adds the session jti to the revocation store', async () => {
    const { router, revocations } = makeRouter();
    const { jwt, claims } = await mintSessionJwt(SECRET, { userId: 'u-1', ttlSeconds: 60 });
    expect(await revocations.isRevoked(claims.jti)).toBe(false);
    const res = await router.request('/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status).toBe(200);
    expect(await revocations.isRevoked(claims.jti)).toBe(true);
  });

  it('returns 200 even for invalid tokens (idempotent)', async () => {
    const { router } = makeRouter();
    const res = await router.request('/logout', {
      method: 'POST',
      headers: { Authorization: 'Bearer not-a-jwt' },
    });
    expect(res.status).toBe(200);
  });

  it('returns 400 when no token is supplied', async () => {
    const { router } = makeRouter();
    const res = await router.request('/logout', { method: 'POST' });
    expect(res.status).toBe(400);
  });
});
