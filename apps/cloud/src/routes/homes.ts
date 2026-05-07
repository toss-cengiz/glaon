// Home registry REST surface — issue #344. All routes behind `requireClerkSession`;
// every query filters by the authenticated user, with 404 (not 403) on cross-tenant
// access to avoid existence leaks (per acceptance criteria).

import { Hono } from 'hono';

import type { AppEnv } from '../index';
import { HomeRegistryRepo } from '../db/repo';

interface CreateHomeBody {
  readonly name?: unknown;
}

export const homesRouter = new Hono<AppEnv>();

homesRouter.post('/', async (c) => {
  const clerkUserId = c.get('clerkUserId');
  const repo = new HomeRegistryRepo(c.env.DB);
  const body = (await c.req.json().catch(() => ({}))) as CreateHomeBody;
  if (typeof body.name !== 'string' || body.name.trim().length === 0) {
    return c.json({ error: 'invalid', code: 'name-required' }, 400);
  }
  const now = Date.now();
  const user = await repo.upsertUser(clerkUserId, now);
  const homeId = crypto.randomUUID();
  await repo.createHome(homeId, user.id, body.name.trim(), now);
  await repo.writeEvent(
    {
      type: 'home_created',
      userId: user.id,
      homeId,
      ip: clientIp(c),
      userAgent: c.req.header('User-Agent'),
    },
    now,
  );
  return c.json({ id: homeId, name: body.name.trim(), createdAt: now }, 201);
});

homesRouter.get('/', async (c) => {
  const clerkUserId = c.get('clerkUserId');
  const repo = new HomeRegistryRepo(c.env.DB);
  const user = await repo.upsertUser(clerkUserId, Date.now());
  const homes = await repo.listHomes(user.id);
  return c.json({
    homes: homes.map((h) => ({
      id: h.id,
      name: h.name,
      createdAt: h.created_at,
      lastSeenAt: h.last_seen_at,
    })),
  });
});

homesRouter.get('/:id', async (c) => {
  const clerkUserId = c.get('clerkUserId');
  const repo = new HomeRegistryRepo(c.env.DB);
  const user = await repo.upsertUser(clerkUserId, Date.now());
  const home = await repo.getHome(c.req.param('id'), user.id);
  if (home === null) return c.json({ error: 'not-found' }, 404);
  return c.json({
    id: home.id,
    name: home.name,
    createdAt: home.created_at,
    lastSeenAt: home.last_seen_at,
  });
});

homesRouter.delete('/:id', async (c) => {
  const clerkUserId = c.get('clerkUserId');
  const repo = new HomeRegistryRepo(c.env.DB);
  const now = Date.now();
  const user = await repo.upsertUser(clerkUserId, now);
  const homeId = c.req.param('id');
  const ok = await repo.revokeHome(homeId, user.id, now);
  if (!ok) return c.json({ error: 'not-found' }, 404);
  await repo.writeEvent(
    {
      type: 'home_revoked',
      userId: user.id,
      homeId,
      ip: clientIp(c),
      userAgent: c.req.header('User-Agent'),
      reason: 'user_revoked',
    },
    now,
  );
  return c.body(null, 204);
});

function clientIp(c: {
  req: { header: (name: string) => string | undefined };
}): string | undefined {
  return c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For');
}
