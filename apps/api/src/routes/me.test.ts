import { describe, expect, it } from 'vitest';

import { decodeSecret, mintSessionJwt } from '../auth/jwt';
import { InMemoryRevocationStore } from '../auth/revocation';
import { InMemoryUsersRepo } from '../db/users-repo-fake';
import { createMeRouter } from './me';

const SECRET = decodeSecret('a'.repeat(32));

async function withAuth(userId: string): Promise<{
  router: ReturnType<typeof createMeRouter>;
  repo: InMemoryUsersRepo;
  authHeader: string;
}> {
  const repo = new InMemoryUsersRepo();
  const revocations = new InMemoryRevocationStore();
  const router = createMeRouter({
    db: {} as never,
    secret: SECRET,
    revocations,
    repo,
    now: () => new Date('2026-05-10T00:00:00.000Z'),
  });
  const { jwt } = await mintSessionJwt(SECRET, { userId, ttlSeconds: 600 });
  return { router, repo, authHeader: `Bearer ${jwt}` };
}

describe('GET /me/preferences', () => {
  it('returns 401 without a session', async () => {
    const { router } = await withAuth('user-1');
    const res = await router.request('/preferences');
    expect(res.status).toBe(401);
  });

  it('returns the default preferences for a fresh user', async () => {
    const { router, authHeader } = await withAuth('user-1');
    const res = await router.request('/preferences', { headers: { Authorization: authHeader } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ locale: null });
  });

  it('returns the persisted locale once set', async () => {
    const { router, repo, authHeader } = await withAuth('user-1');
    await repo.updatePreferences('user-1', { locale: 'tr' }, new Date());
    const res = await router.request('/preferences', { headers: { Authorization: authHeader } });
    expect(await res.json()).toEqual({ locale: 'tr' });
  });

  it("never surfaces another user's preferences", async () => {
    const { router, repo, authHeader } = await withAuth('user-1');
    await repo.updatePreferences('user-2', { locale: 'tr' }, new Date());
    const res = await router.request('/preferences', { headers: { Authorization: authHeader } });
    expect(await res.json()).toEqual({ locale: null });
  });
});

describe('PATCH /me/preferences', () => {
  it('returns 401 without a session', async () => {
    const { router } = await withAuth('user-1');
    const res = await router.request('/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: 'tr' }),
    });
    expect(res.status).toBe(401);
  });

  it('persists a supported locale and returns the next state', async () => {
    const { router, repo, authHeader } = await withAuth('user-1');
    const res = await router.request('/preferences', {
      method: 'PATCH',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: 'tr' }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ locale: 'tr' });
    expect(await repo.getPreferences('user-1')).toEqual({ locale: 'tr' });
  });

  it('clears the preference when locale is null', async () => {
    const { router, repo, authHeader } = await withAuth('user-1');
    await repo.updatePreferences('user-1', { locale: 'tr' }, new Date());
    const res = await router.request('/preferences', {
      method: 'PATCH',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: null }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ locale: null });
    expect(await repo.getPreferences('user-1')).toEqual({ locale: null });
  });

  it('rejects an unsupported locale with 400', async () => {
    const { router, repo, authHeader } = await withAuth('user-1');
    const res = await router.request('/preferences', {
      method: 'PATCH',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: 'fr' }),
    });
    expect(res.status).toBe(400);
    expect(await repo.getPreferences('user-1')).toEqual({ locale: null });
  });

  it('rejects unknown extra fields with 400 (strict)', async () => {
    const { router, authHeader } = await withAuth('user-1');
    const res = await router.request('/preferences', {
      method: 'PATCH',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: 'tr', theme: 'dark' }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects a non-JSON body with 400', async () => {
    const { router, authHeader } = await withAuth('user-1');
    const res = await router.request('/preferences', {
      method: 'PATCH',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: 'not-json',
    });
    expect(res.status).toBe(400);
  });
});
