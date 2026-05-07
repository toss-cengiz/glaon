// Home-registry repository. Cross-tenant invariant: every read filters by
// `owner_user_id`; cross-tenant access surfaces as `null` (404 at the route layer)
// rather than 403 — preserves existence-leak protection per the issue's acceptance
// note.

import type { D1Database } from './types';

interface UserRow {
  id: number;
  clerk_user_id: string;
  created_at: number;
}

interface HomeRow {
  id: string;
  owner_user_id: number;
  name: string;
  created_at: number;
  last_seen_at: number | null;
  revoked_at: number | null;
}

interface HomeEvent {
  readonly type: string;
  readonly userId: number | null;
  readonly homeId: string | null;
  readonly ip?: string | undefined;
  readonly userAgent?: string | undefined;
  readonly reason?: string | undefined;
}

export class HomeRegistryRepo {
  constructor(private readonly db: D1Database) {}

  /**
   * Find or create the local user row for the given Clerk user id. Idempotent.
   * Subsequent calls for the same Clerk user return the same `id`.
   */
  async upsertUser(clerkUserId: string, now: number): Promise<UserRow> {
    const existing = (await this.db
      .prepare('SELECT id, clerk_user_id, created_at FROM users WHERE clerk_user_id = ?')
      .bind(clerkUserId)
      .first()) as UserRow | null;
    if (existing !== null) return existing;
    await this.db
      .prepare('INSERT INTO users (clerk_user_id, created_at) VALUES (?, ?)')
      .bind(clerkUserId, now)
      .run();
    const fresh = (await this.db
      .prepare('SELECT id, clerk_user_id, created_at FROM users WHERE clerk_user_id = ?')
      .bind(clerkUserId)
      .first()) as UserRow | null;
    if (fresh === null) throw new Error('failed to upsert user');
    return fresh;
  }

  async createHome(homeId: string, ownerUserId: number, name: string, now: number): Promise<void> {
    await this.db
      .prepare('INSERT INTO homes (id, owner_user_id, name, created_at) VALUES (?, ?, ?, ?)')
      .bind(homeId, ownerUserId, name, now)
      .run();
  }

  async listHomes(ownerUserId: number): Promise<HomeRow[]> {
    const result = await this.db
      .prepare(
        'SELECT id, owner_user_id, name, created_at, last_seen_at, revoked_at FROM homes WHERE owner_user_id = ? AND revoked_at IS NULL ORDER BY created_at DESC',
      )
      .bind(ownerUserId)
      .all();
    return result.results as HomeRow[];
  }

  async getHome(homeId: string, ownerUserId: number): Promise<HomeRow | null> {
    return (await this.db
      .prepare(
        'SELECT id, owner_user_id, name, created_at, last_seen_at, revoked_at FROM homes WHERE id = ? AND owner_user_id = ? AND revoked_at IS NULL',
      )
      .bind(homeId, ownerUserId)
      .first()) as HomeRow | null;
  }

  /**
   * Soft-revoke the home and its relay-secret hash. Cross-tenant guard: only the
   * owner can revoke. Returns `false` if the home does not exist or is owned by
   * another user — caller surfaces as 404 (existence leak protection).
   */
  async revokeHome(homeId: string, ownerUserId: number, now: number): Promise<boolean> {
    const existing = await this.getHome(homeId, ownerUserId);
    if (existing === null) return false;
    await this.db
      .prepare('UPDATE homes SET revoked_at = ? WHERE id = ? AND owner_user_id = ?')
      .bind(now, homeId, ownerUserId)
      .run();
    await this.db.prepare('DELETE FROM relay_secrets_hash WHERE home_id = ?').bind(homeId).run();
    return true;
  }

  async writeEvent(event: HomeEvent, now: number): Promise<void> {
    await this.db
      .prepare(
        'INSERT INTO home_events (event_type, user_id, home_id, ip, user_agent, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        event.type,
        event.userId,
        event.homeId,
        event.ip ?? null,
        event.userAgent ?? null,
        event.reason ?? null,
        now,
      )
      .run();
  }
}
