// `/me/*` endpoints (#425) — per-user metadata that survives sessions.
//
// Today's surface is `/me/preferences` only (locale persistence). Every
// route is gated by `require-session`; the user id from the session JWT
// is the sole filter on every database call — there is no "look up
// another user's preferences" code path on the server.

import { Hono } from 'hono';
import type { Db } from 'mongodb';

import {
  UserPreferencesUpdateSchema,
  type UserPreferences,
  type UserPreferencesUpdate,
} from '@glaon/core/api-client';

import type { RevocationStore } from '../auth/revocation';
import { UsersRepo } from '../db/users-repo';
import { requireSession, type SessionVariables } from '../middleware/require-session';

interface UsersRepoLike {
  getPreferences(userId: string): Promise<UserPreferences>;
  updatePreferences(
    userId: string,
    patch: UserPreferencesUpdate,
    now: Date,
  ): Promise<UserPreferences>;
}

interface MeRouterDeps {
  readonly db: Db;
  readonly secret: Uint8Array;
  readonly revocations: RevocationStore;
  readonly repo?: UsersRepoLike;
  readonly now?: () => Date;
}

export function createMeRouter(deps: MeRouterDeps): Hono<{ Variables: SessionVariables }> {
  const router = new Hono<{ Variables: SessionVariables }>();
  const repo: UsersRepoLike = deps.repo ?? new UsersRepo(deps.db);
  const now = deps.now ?? (() => new Date());

  router.use('*', requireSession({ secret: deps.secret, revocations: deps.revocations }));

  router.get('/preferences', async (c) => {
    const preferences = await repo.getPreferences(c.get('userId'));
    return c.json(preferences);
  });

  router.patch('/preferences', async (c) => {
    const body: unknown = await c.req.json().catch(() => null);
    const parsed = UserPreferencesUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'invalid', code: 'bad-body' }, 400);
    }
    const next = await repo.updatePreferences(c.get('userId'), parsed.data, now());
    return c.json(next);
  });

  return router;
}
