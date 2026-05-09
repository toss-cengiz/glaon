// Saved dashboard layouts endpoints (#420). The first concrete domain
// surface for apps/api — proves the route + Zod parse + driver call +
// authorization shape that subsequent feature endpoints will follow.
//
// Authorization: every route is gated by the `require-session`
// middleware; the user id from the session JWT is the sole filter on
// every database query — user A cannot read or modify user B's
// layouts even when guessing an id.
//
// Soft-delete: DELETE sets `deletedAt`; the list query filters by
// `deletedAt: null`. The collection grows over time but is bounded by
// per-user retention (Phase 5 cleanup job).

import { Hono } from 'hono';
import type { Db } from 'mongodb';

import { CreateLayoutRequestSchema, UpdateLayoutRequestSchema } from '@glaon/core/api-client';

import { LayoutsRepo, type PublicLayout } from '../db/layouts-repo';
import { requireSession, type SessionVariables } from '../middleware/require-session';
import type { RevocationStore } from '../auth/revocation';

interface LayoutsRepoLike {
  list(userId: string, options?: { homeId?: string }): Promise<PublicLayout[]>;
  getById(id: string, userId: string): Promise<PublicLayout | null>;
  create(input: {
    id: string;
    userId: string;
    homeId: string;
    name: string;
    payload: Record<string, unknown>;
    now: Date;
  }): Promise<PublicLayout>;
  update(
    id: string,
    userId: string,
    input: { name?: string; payload?: Record<string, unknown>; now: Date },
  ): Promise<PublicLayout | null>;
  softDelete(id: string, userId: string, now: Date): Promise<boolean>;
}

interface LayoutsRouterDeps {
  readonly db: Db;
  readonly secret: Uint8Array;
  readonly revocations: RevocationStore;
  readonly repo?: LayoutsRepoLike;
  readonly now?: () => Date;
  readonly newId?: () => string;
}

export function createLayoutsRouter(deps: LayoutsRouterDeps): Hono<{
  Variables: SessionVariables;
}> {
  const router = new Hono<{ Variables: SessionVariables }>();
  const repo: LayoutsRepoLike = deps.repo ?? new LayoutsRepo(deps.db);
  const now = deps.now ?? (() => new Date());
  const newId = deps.newId ?? (() => crypto.randomUUID());

  router.use('*', requireSession({ secret: deps.secret, revocations: deps.revocations }));

  router.get('/', async (c) => {
    const homeId = c.req.query('homeId');
    const layouts = await repo.list(c.get('userId'), {
      ...(homeId !== undefined && homeId.length > 0 ? { homeId } : {}),
    });
    return c.json({ layouts });
  });

  router.post('/', async (c) => {
    const body: unknown = await c.req.json().catch(() => null);
    const parsed = CreateLayoutRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'invalid', code: 'bad-body' }, 400);
    }
    const layout = await repo.create({
      id: newId(),
      userId: c.get('userId'),
      homeId: parsed.data.homeId,
      name: parsed.data.name,
      payload: parsed.data.payload,
      now: now(),
    });
    return c.json(asResponse(layout), 201);
  });

  router.get('/:id', async (c) => {
    const layout = await repo.getById(c.req.param('id'), c.get('userId'));
    if (layout === null) return c.json({ error: 'not-found' }, 404);
    return c.json(asResponse(layout));
  });

  router.put('/:id', async (c) => {
    const body: unknown = await c.req.json().catch(() => null);
    const parsed = UpdateLayoutRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'invalid', code: 'bad-body' }, 400);
    }
    const layout = await repo.update(c.req.param('id'), c.get('userId'), {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.payload !== undefined ? { payload: parsed.data.payload } : {}),
      now: now(),
    });
    if (layout === null) return c.json({ error: 'not-found' }, 404);
    return c.json(asResponse(layout));
  });

  router.delete('/:id', async (c) => {
    const ok = await repo.softDelete(c.req.param('id'), c.get('userId'), now());
    if (!ok) return c.json({ error: 'not-found' }, 404);
    return c.body(null, 204);
  });

  return router;
}

// Re-shape the repo's `PublicLayout` to the on-the-wire schema. They
// happen to be identical today; keeping the conversion explicit makes
// future divergence (e.g. computed fields) trivial.
function asResponse(layout: PublicLayout): PublicLayout {
  return layout;
}
