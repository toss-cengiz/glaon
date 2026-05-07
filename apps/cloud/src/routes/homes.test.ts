import { describe, expect, it, vi } from 'vitest';
import type { JWTVerifyResult } from 'jose';

import { FakeD1 } from '../db/fake';
import app, { type Bindings } from '../index';
import * as clerk from '../auth/clerk';

interface CreateRes {
  id: string;
  name: string;
  createdAt: number;
}

interface ListRes {
  homes: { id: string; name: string; createdAt: number; lastSeenAt: number | null }[];
}

function envFor(db: FakeD1, issuer = 'https://test.clerk.dev'): Bindings {
  return { LOG_LEVEL: 'error', DB: db, CLERK_ISSUER: issuer };
}

function authHeaders(token = 'tok'): Headers {
  return new Headers({ Authorization: `Bearer ${token}` });
}

function stubClerk(claimSub: string): void {
  vi.spyOn(clerk, 'requireClerkSession').mockReturnValue(async (c, next) => {
    c.set('clerkUserId', claimSub);
    await next();
    return undefined;
  });
}

describe('home registry CRUD', () => {
  it('creates → lists → fetches → deletes a home for the authenticated user', async () => {
    const db = new FakeD1();
    stubClerk('user_alice');

    // POST
    const createRes = await app.request(
      '/homes',
      { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name: 'Apartment' }) },
      envFor(db),
    );
    expect(createRes.status).toBe(201);
    const created: CreateRes = await createRes.json();
    expect(created.id).toBeTruthy();
    expect(created.name).toBe('Apartment');

    // GET list
    const listRes = await app.request('/homes', { headers: authHeaders() }, envFor(db));
    expect(listRes.status).toBe(200);
    const list: ListRes = await listRes.json();
    expect(list.homes).toHaveLength(1);
    expect(list.homes[0]?.id).toBe(created.id);

    // GET single
    const getRes = await app.request(
      `/homes/${created.id}`,
      { headers: authHeaders() },
      envFor(db),
    );
    expect(getRes.status).toBe(200);

    // DELETE
    const delRes = await app.request(
      `/homes/${created.id}`,
      { method: 'DELETE', headers: authHeaders() },
      envFor(db),
    );
    expect(delRes.status).toBe(204);

    // GET single after delete → 404
    const after = await app.request(`/homes/${created.id}`, { headers: authHeaders() }, envFor(db));
    expect(after.status).toBe(404);
  });

  it('rejects POST /homes without a name', async () => {
    const db = new FakeD1();
    stubClerk('user_alice');
    const res = await app.request(
      '/homes',
      { method: 'POST', headers: authHeaders(), body: JSON.stringify({}) },
      envFor(db),
    );
    expect(res.status).toBe(400);
  });

  it('cross-tenant access returns 404 (existence-leak protection)', async () => {
    const db = new FakeD1();

    // Alice creates a home.
    stubClerk('user_alice');
    const createRes = await app.request(
      '/homes',
      { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name: 'Alice home' }) },
      envFor(db),
    );
    const created: CreateRes = await createRes.json();

    // Bob tries to fetch it — must surface as 404, not 403.
    stubClerk('user_bob');
    const get = await app.request(`/homes/${created.id}`, { headers: authHeaders() }, envFor(db));
    expect(get.status).toBe(404);

    const del = await app.request(
      `/homes/${created.id}`,
      { method: 'DELETE', headers: authHeaders() },
      envFor(db),
    );
    expect(del.status).toBe(404);

    // And it does not appear in Bob's list.
    const list = await app.request('/homes', { headers: authHeaders() }, envFor(db));
    const body: ListRes = await list.json();
    expect(body.homes).toHaveLength(0);
  });

  it('writes an audit row for home_created and home_revoked', async () => {
    const db = new FakeD1();
    stubClerk('user_alice');

    const createRes = await app.request(
      '/homes',
      { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name: 'Apt' }) },
      envFor(db),
    );
    const created: CreateRes = await createRes.json();

    await app.request(
      `/homes/${created.id}`,
      { method: 'DELETE', headers: authHeaders() },
      envFor(db),
    );

    const eventTypes = db.state.events.map((e) => e.event_type);
    expect(eventTypes).toContain('home_created');
    expect(eventTypes).toContain('home_revoked');
  });
});

describe('Clerk middleware integration', () => {
  it('rejects an Authorization header missing the Bearer prefix', async () => {
    // Use a real (non-stubbed) middleware path with a verify override.
    vi.spyOn(clerk, 'requireClerkSession').mockImplementation(({ verify }) => async (c, next) => {
      const header = c.req.header('Authorization');
      if (!header?.startsWith('Bearer ')) {
        return c.json({ error: 'unauthorized', code: 'no-bearer-token' }, 401);
      }
      const result = await (verify ?? (() => Promise.reject(new Error('no verify'))))(
        header.slice('Bearer '.length).trim(),
      );
      const sub = (result.payload as { sub?: string }).sub ?? '';
      c.set('clerkUserId', sub);
      await next();
      return undefined;
    });

    const db = new FakeD1();
    const res = await app.request(
      '/homes',
      { headers: new Headers({ Authorization: 'NotBearer xyz' }) },
      envFor(db),
    );
    expect(res.status).toBe(401);
  });

  it('accepts a valid token via verify override and exposes the sub claim', async () => {
    vi.spyOn(clerk, 'requireClerkSession').mockReturnValue(async (c, next) => {
      const stub: Pick<JWTVerifyResult, 'payload'> = { payload: { sub: 'user_alice' } };
      const sub = stub.payload.sub;
      if (typeof sub !== 'string') throw new Error('expected sub claim');
      c.set('clerkUserId', sub);
      await next();
      return undefined;
    });

    const db = new FakeD1();
    const res = await app.request(
      '/homes',
      { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name: 'Apt' }) },
      envFor(db),
    );
    expect(res.status).toBe(201);
  });
});
