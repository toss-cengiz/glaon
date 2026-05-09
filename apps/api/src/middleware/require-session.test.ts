import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { decodeSecret, mintSessionJwt } from '../auth/jwt';
import { InMemoryRevocationStore } from '../auth/revocation';
import { requireSession, SESSION_COOKIE_NAME, type SessionVariables } from './require-session';

const SECRET = decodeSecret('a'.repeat(32));

function makeApp(revocations: InMemoryRevocationStore) {
  const app = new Hono<{ Variables: SessionVariables }>();
  app.use('/protected/*', requireSession({ secret: SECRET, revocations }));
  app.get('/protected/me', (c) => c.json({ userId: c.var.userId, jti: c.var.sessionJti }));
  return app;
}

describe('requireSession middleware', () => {
  it('returns 401 when no session is presented', async () => {
    const app = makeApp(new InMemoryRevocationStore());
    const res = await app.request('/protected/me');
    expect(res.status).toBe(401);
  });

  it('accepts a Bearer token and exposes the user id', async () => {
    const app = makeApp(new InMemoryRevocationStore());
    const { jwt, claims } = await mintSessionJwt(SECRET, { userId: 'u-1', ttlSeconds: 60 });
    const res = await app.request('/protected/me', {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ userId: 'u-1', jti: claims.jti });
  });

  it('accepts a session cookie and exposes the user id', async () => {
    const app = makeApp(new InMemoryRevocationStore());
    const { jwt } = await mintSessionJwt(SECRET, { userId: 'u-2', ttlSeconds: 60 });
    const res = await app.request('/protected/me', {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${jwt}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { userId: string };
    expect(body.userId).toBe('u-2');
  });

  it('rejects a revoked session', async () => {
    const revocations = new InMemoryRevocationStore();
    const app = makeApp(revocations);
    const { jwt, claims } = await mintSessionJwt(SECRET, { userId: 'u', ttlSeconds: 60 });
    await revocations.revoke(claims.jti, 'u', claims.exp);
    const res = await app.request('/protected/me', {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status).toBe(401);
  });

  it('rejects a tampered session JWT', async () => {
    const app = makeApp(new InMemoryRevocationStore());
    const res = await app.request('/protected/me', {
      headers: { Authorization: 'Bearer not-a-jwt' },
    });
    expect(res.status).toBe(401);
  });
});
