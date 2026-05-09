import { describe, expect, it } from 'vitest';

import { decodeSecret, mintSessionJwt } from '../auth/jwt';
import { InMemoryRevocationStore } from '../auth/revocation';
import { InMemoryLayoutsRepo } from '../db/layouts-repo-fake';
import { createLayoutsRouter } from './layouts';

const SECRET = decodeSecret('a'.repeat(32));

async function withAuth(userId: string): Promise<{
  router: ReturnType<typeof createLayoutsRouter>;
  repo: InMemoryLayoutsRepo;
  authHeader: string;
}> {
  const repo = new InMemoryLayoutsRepo();
  const revocations = new InMemoryRevocationStore();
  const router = createLayoutsRouter({
    db: {} as never,
    secret: SECRET,
    revocations,
    repo,
    now: () => new Date('2026-05-10T00:00:00.000Z'),
    newId: () => 'layout-1',
  });
  const { jwt } = await mintSessionJwt(SECRET, { userId, ttlSeconds: 600 });
  return { router, repo, authHeader: `Bearer ${jwt}` };
}

describe('GET /layouts', () => {
  it('returns 401 without a session', async () => {
    const { router } = await withAuth('user-1');
    const res = await router.request('/');
    expect(res.status).toBe(401);
  });

  it('returns the user layouts list', async () => {
    const { router, repo, authHeader } = await withAuth('user-1');
    await repo.create({
      id: 'a',
      userId: 'user-1',
      homeId: 'home-1',
      name: 'Living room',
      payload: { rows: 2 },
      now: new Date('2026-05-09T00:00:00.000Z'),
    });
    const res = await router.request('/', { headers: { Authorization: authHeader } });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { layouts: { id: string; name: string }[] };
    expect(body.layouts).toHaveLength(1);
    expect(body.layouts[0]?.name).toBe('Living room');
  });

  it('filters by homeId when provided', async () => {
    const { router, repo, authHeader } = await withAuth('user-1');
    await repo.create({
      id: 'a',
      userId: 'user-1',
      homeId: 'home-1',
      name: 'A',
      payload: {},
      now: new Date(),
    });
    await repo.create({
      id: 'b',
      userId: 'user-1',
      homeId: 'home-2',
      name: 'B',
      payload: {},
      now: new Date(),
    });
    const res = await router.request('/?homeId=home-1', {
      headers: { Authorization: authHeader },
    });
    const body = (await res.json()) as { layouts: { id: string }[] };
    expect(body.layouts.map((layout) => layout.id)).toEqual(['a']);
  });

  it("never surfaces another user's layouts", async () => {
    const { router, repo, authHeader } = await withAuth('user-1');
    await repo.create({
      id: 'foreign',
      userId: 'user-2',
      homeId: 'home-1',
      name: 'Not yours',
      payload: {},
      now: new Date(),
    });
    const res = await router.request('/', { headers: { Authorization: authHeader } });
    const body = (await res.json()) as { layouts: unknown[] };
    expect(body.layouts).toHaveLength(0);
  });
});

describe('POST /layouts', () => {
  it('persists the layout and returns 201 + the canonical doc', async () => {
    const { router, repo, authHeader } = await withAuth('user-1');
    const res = await router.request('/', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        homeId: 'home-1',
        name: 'Kitchen',
        payload: { theme: 'dark' },
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; userId: string; name: string };
    expect(body.id).toBe('layout-1');
    expect(body.userId).toBe('user-1');
    const stored = await repo.getById('layout-1', 'user-1');
    expect(stored?.name).toBe('Kitchen');
  });

  it('rejects an invalid body with 400', async () => {
    const { router, authHeader } = await withAuth('user-1');
    const res = await router.request('/', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: '' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /layouts/:id', () => {
  it('returns 404 for an id the user does not own', async () => {
    const { router, repo, authHeader } = await withAuth('user-1');
    await repo.create({
      id: 'foreign',
      userId: 'user-2',
      homeId: 'home-1',
      name: 'Not yours',
      payload: {},
      now: new Date(),
    });
    const res = await router.request('/foreign', {
      headers: { Authorization: authHeader },
    });
    expect(res.status).toBe(404);
  });

  it('returns the layout for an id the user owns', async () => {
    const { router, repo, authHeader } = await withAuth('user-1');
    await repo.create({
      id: 'a',
      userId: 'user-1',
      homeId: 'home-1',
      name: 'Living',
      payload: {},
      now: new Date(),
    });
    const res = await router.request('/a', { headers: { Authorization: authHeader } });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string };
    expect(body.id).toBe('a');
  });
});

describe('PUT /layouts/:id', () => {
  it('updates the name + payload', async () => {
    const { router, repo, authHeader } = await withAuth('user-1');
    await repo.create({
      id: 'a',
      userId: 'user-1',
      homeId: 'home-1',
      name: 'Old',
      payload: { v: 1 },
      now: new Date('2026-05-08T00:00:00.000Z'),
    });
    const res = await router.request('/a', {
      method: 'PUT',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'New', payload: { v: 2 } }),
    });
    expect(res.status).toBe(200);
    const stored = await repo.getById('a', 'user-1');
    expect(stored?.name).toBe('New');
    expect(stored?.payload).toEqual({ v: 2 });
  });

  it('returns 404 when the layout does not exist or belongs to another user', async () => {
    const { router, authHeader } = await withAuth('user-1');
    const res = await router.request('/missing', {
      method: 'PUT',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'x' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /layouts/:id', () => {
  it('soft-deletes and returns 204', async () => {
    const { router, repo, authHeader } = await withAuth('user-1');
    await repo.create({
      id: 'a',
      userId: 'user-1',
      homeId: 'home-1',
      name: 'A',
      payload: {},
      now: new Date(),
    });
    const res = await router.request('/a', {
      method: 'DELETE',
      headers: { Authorization: authHeader },
    });
    expect(res.status).toBe(204);
    expect(await repo.getById('a', 'user-1')).toBeNull();
  });

  it('returns 404 for an unknown id', async () => {
    const { router, authHeader } = await withAuth('user-1');
    const res = await router.request('/missing', {
      method: 'DELETE',
      headers: { Authorization: authHeader },
    });
    expect(res.status).toBe(404);
  });
});
