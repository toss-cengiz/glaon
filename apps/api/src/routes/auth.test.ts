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

describe('POST /auth/ha/password-grant', () => {
  // The login_flow proxy makes three sequential calls to HA:
  //   POST /auth/login_flow         — returns { flow_id, type: "form" }
  //   POST /auth/login_flow/<id>    — returns either create_entry / form / abort
  //   POST /auth/token              — returns access_token + refresh_token
  // The helper builds a fetch mock that scripts each step in order.
  function makeLoginFlowFetch(steps: {
    initBody?: unknown;
    submitBody?: unknown;
    tokenBody?: unknown;
    submitStatus?: number;
    tokenStatus?: number;
    initStatus?: number;
  }): typeof fetch {
    let call = 0;
    return makeFetch((input) => {
      call += 1;
      const url: string = input;
      if (call === 1 && url.endsWith('/auth/login_flow')) {
        return new Response(JSON.stringify(steps.initBody ?? { flow_id: 'F-1', type: 'form' }), {
          status: steps.initStatus ?? 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (call === 2 && url.includes('/auth/login_flow/')) {
        return new Response(
          JSON.stringify(steps.submitBody ?? { type: 'create_entry', result: 'AUTH-CODE' }),
          {
            status: steps.submitStatus ?? 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
      if (call === 3 && url.endsWith('/auth/token')) {
        return new Response(
          JSON.stringify(
            steps.tokenBody ?? {
              access_token: 'ha-access-1',
              refresh_token: 'ha-refresh-1',
              expires_in: 1800,
              token_type: 'Bearer',
            },
          ),
          {
            status: steps.tokenStatus ?? 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
      return new Response('unexpected', { status: 500 });
    });
  }

  const validBody = {
    haBaseUrl: 'http://homeassistant.local:8123',
    username: 'olivia',
    password: 'correct-horse',
    clientId: 'https://app.glaon.com/',
  };

  it('returns haAccess + sessionJwt on a successful flow', async () => {
    const fetchImpl = makeLoginFlowFetch({});
    const { router } = makeRouter({ fetchImpl });
    const res = await router.request('/ha/password-grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      haAccess: { accessToken: string; refreshToken: string; expiresIn: number; tokenType: string };
      sessionJwt: string;
      expiresAt: number;
    };
    expect(body.haAccess.accessToken).toBe('ha-access-1');
    expect(body.haAccess.refreshToken).toBe('ha-refresh-1');
    expect(body.haAccess.expiresIn).toBe(1800);
    expect(body.haAccess.tokenType).toBe('Bearer');
    expect(typeof body.sessionJwt).toBe('string');
    expect(body.expiresAt).toBeGreaterThan(Date.now());
    const claims = await verifySessionJwt(SECRET, body.sessionJwt);
    expect(claims).not.toBeNull();
  });

  it('returns 400 for an invalid request body', async () => {
    const { router } = makeRouter();
    const res = await router.request('/ha/password-grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validBody, haBaseUrl: 'not-a-url' }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 401 when HA aborts the flow with invalid_auth', async () => {
    const fetchImpl = makeLoginFlowFetch({
      submitBody: { type: 'abort', reason: 'invalid_auth' },
    });
    const { router } = makeRouter({ fetchImpl });
    const res = await router.request('/ha/password-grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('invalid-credentials');
  });

  it('returns 502 mfa-required when HA escalates to a follow-up form', async () => {
    const fetchImpl = makeLoginFlowFetch({
      submitBody: { type: 'form', step_id: 'mfa', flow_id: 'F-1' },
    });
    const { router } = makeRouter({ fetchImpl });
    const res = await router.request('/ha/password-grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('mfa-required');
  });

  it('returns 502 unreachable when HA cannot be contacted', async () => {
    const fetchImpl = makeFetch(() => Promise.reject(new TypeError('network')));
    const { router } = makeRouter({ fetchImpl });
    const res = await router.request('/ha/password-grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('unreachable');
  });

  it('returns 502 flow-error when the token endpoint responds with garbage', async () => {
    const fetchImpl = makeLoginFlowFetch({
      tokenBody: { not: 'a token response' },
    });
    const { router } = makeRouter({ fetchImpl });
    const res = await router.request('/ha/password-grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('flow-error');
  });

  it('sets an httpOnly Secure cookie when Origin matches the allowlist', async () => {
    const fetchImpl = makeLoginFlowFetch({});
    const { router } = makeRouter({ fetchImpl, webOrigins: ['https://app.glaon.com'] });
    const res = await router.request('/ha/password-grant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://app.glaon.com',
      },
      body: JSON.stringify(validBody),
    });
    expect(res.status).toBe(200);
    const cookie = res.headers.get('Set-Cookie');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Strict');
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
