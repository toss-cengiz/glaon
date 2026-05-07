// In-memory D1 stub for unit tests. Implements the narrow shape the repo uses;
// each prepared statement matches against a regex on the SQL text and pulls the
// arguments off the bind list. Production runs against the real CF D1 binding.

import type { D1Database, D1PreparedStatement } from './types';

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

interface RelaySecretRow {
  home_id: string;
  hash: string;
  created_at: number;
}

interface EventRow {
  id: number;
  event_type: string;
  user_id: number | null;
  home_id: string | null;
  ip: string | null;
  user_agent: string | null;
  reason: string | null;
  created_at: number;
}

interface PairCodeRow {
  id: number;
  code: string;
  clerk_user_id: string;
  created_at: number;
  expires_at: number;
  claimed_at: number | null;
  claimed_home_id: string | null;
}

interface PairFailureRow {
  ip: string;
  attempts: number;
  locked_until: number | null;
}

class Statement implements D1PreparedStatement {
  private boundArgs: unknown[] = [];

  constructor(
    private readonly query: string,
    private readonly state: FakeD1State,
  ) {}

  bind(...values: unknown[]): D1PreparedStatement {
    this.boundArgs = values;
    return this;
  }

  async first(): Promise<unknown> {
    return Promise.resolve(this.runOnce());
  }

  async all(): Promise<{ results: unknown[] }> {
    const result = this.runOnce();
    if (Array.isArray(result)) return Promise.resolve({ results: result });
    return Promise.resolve({ results: result === null ? [] : [result] });
  }

  async run(): Promise<{ success: boolean; meta?: Record<string, unknown> }> {
    this.runOnce();
    return Promise.resolve({ success: true });
  }

  private runOnce(): unknown {
    const q = this.query.trim();
    if (q.startsWith('SELECT id, clerk_user_id, created_at FROM users WHERE clerk_user_id = ?')) {
      const [clerkUserId] = this.boundArgs as [string];
      return this.state.users.find((u) => u.clerk_user_id === clerkUserId) ?? null;
    }
    if (q.startsWith('INSERT INTO users')) {
      const [clerkUserId, createdAt] = this.boundArgs as [string, number];
      const id = this.state.users.length + 1;
      this.state.users.push({ id, clerk_user_id: clerkUserId, created_at: createdAt });
      return null;
    }
    if (q.startsWith('INSERT INTO homes')) {
      const [id, ownerUserId, name, createdAt] = this.boundArgs as [string, number, string, number];
      this.state.homes.push({
        id,
        owner_user_id: ownerUserId,
        name,
        created_at: createdAt,
        last_seen_at: null,
        revoked_at: null,
      });
      return null;
    }
    if (
      q.startsWith(
        'SELECT id, owner_user_id, name, created_at, last_seen_at, revoked_at FROM homes WHERE owner_user_id = ?',
      )
    ) {
      const [ownerUserId] = this.boundArgs as [number];
      return this.state.homes
        .filter((h) => h.owner_user_id === ownerUserId && h.revoked_at === null)
        .sort((a, b) => b.created_at - a.created_at);
    }
    if (
      q.startsWith(
        'SELECT id, owner_user_id, name, created_at, last_seen_at, revoked_at FROM homes WHERE id = ?',
      )
    ) {
      const [homeId, ownerUserId] = this.boundArgs as [string, number];
      return (
        this.state.homes.find(
          (h) => h.id === homeId && h.owner_user_id === ownerUserId && h.revoked_at === null,
        ) ?? null
      );
    }
    if (q.startsWith('UPDATE homes SET revoked_at')) {
      const [revokedAt, homeId, ownerUserId] = this.boundArgs as [number, string, number];
      const home = this.state.homes.find((h) => h.id === homeId && h.owner_user_id === ownerUserId);
      if (home) home.revoked_at = revokedAt;
      return null;
    }
    if (q.startsWith('DELETE FROM relay_secrets_hash')) {
      const [homeId] = this.boundArgs as [string];
      this.state.relaySecrets = this.state.relaySecrets.filter((r) => r.home_id !== homeId);
      return null;
    }
    /* ---------- pair_codes ---------- */
    if (q.startsWith('INSERT INTO pair_codes')) {
      const [code, clerkUserId, createdAt, expiresAt] = this.boundArgs as [
        string,
        string,
        number,
        number,
      ];
      this.state.pairCodes.push({
        id: this.state.pairCodes.length + 1,
        code,
        clerk_user_id: clerkUserId,
        created_at: createdAt,
        expires_at: expiresAt,
        claimed_at: null,
        claimed_home_id: null,
      });
      return null;
    }
    if (
      q.startsWith(
        'SELECT id, code, clerk_user_id, created_at, expires_at, claimed_at, claimed_home_id FROM pair_codes WHERE code = ? AND clerk_user_id = ?',
      )
    ) {
      const [code, clerkUserId] = this.boundArgs as [string, string];
      return (
        this.state.pairCodes.find((p) => p.code === code && p.clerk_user_id === clerkUserId) ?? null
      );
    }
    if (
      q.startsWith(
        'SELECT id, code, clerk_user_id, created_at, expires_at, claimed_at, claimed_home_id FROM pair_codes WHERE code = ?',
      )
    ) {
      const [code] = this.boundArgs as [string];
      return this.state.pairCodes.find((p) => p.code === code) ?? null;
    }
    if (q.startsWith('UPDATE pair_codes SET claimed_at')) {
      const [claimedAt, homeId, code, now] = this.boundArgs as [number, string, string, number];
      const row = this.state.pairCodes.find(
        (p) => p.code === code && p.claimed_at === null && p.expires_at > now,
      );
      if (row) {
        row.claimed_at = claimedAt;
        row.claimed_home_id = homeId;
      }
      return null;
    }

    /* ---------- pair_failure_attempts ---------- */
    if (q.startsWith('SELECT ip, attempts, locked_until FROM pair_failure_attempts')) {
      const [ip] = this.boundArgs as [string];
      return this.state.pairFailures.find((f) => f.ip === ip) ?? null;
    }
    if (q.startsWith('INSERT INTO pair_failure_attempts')) {
      const [ip, attempts, lockedUntil] = this.boundArgs as [string, number, number | null];
      this.state.pairFailures.push({ ip, attempts, locked_until: lockedUntil });
      return null;
    }
    if (q.startsWith('UPDATE pair_failure_attempts')) {
      const [attempts, lockedUntil, ip] = this.boundArgs as [number, number | null, string];
      const row = this.state.pairFailures.find((f) => f.ip === ip);
      if (row) {
        row.attempts = attempts;
        row.locked_until = lockedUntil;
      }
      return null;
    }
    if (q.startsWith('DELETE FROM pair_failure_attempts')) {
      const [ip] = this.boundArgs as [string];
      this.state.pairFailures = this.state.pairFailures.filter((f) => f.ip !== ip);
      return null;
    }

    /* ---------- relay_secrets_hash insert ---------- */
    if (q.startsWith('INSERT INTO relay_secrets_hash')) {
      const [homeId, hashValue, createdAt] = this.boundArgs as [string, string, number];
      this.state.relaySecrets.push({ home_id: homeId, hash: hashValue, created_at: createdAt });
      return null;
    }
    if (q.startsWith('SELECT hash FROM relay_secrets_hash')) {
      const [homeId] = this.boundArgs as [string];
      return this.state.relaySecrets.find((r) => r.home_id === homeId) ?? null;
    }

    if (q.startsWith('INSERT INTO home_events')) {
      const [eventType, userId, homeId, ip, userAgent, reason, createdAt] = this.boundArgs as [
        string,
        number | null,
        string | null,
        string | null,
        string | null,
        string | null,
        number,
      ];
      this.state.events.push({
        id: this.state.events.length + 1,
        event_type: eventType,
        user_id: userId,
        home_id: homeId,
        ip,
        user_agent: userAgent,
        reason,
        created_at: createdAt,
      });
      return null;
    }
    throw new Error(`FakeD1: unsupported query: ${q}`);
  }
}

interface FakeD1State {
  users: UserRow[];
  homes: HomeRow[];
  relaySecrets: RelaySecretRow[];
  events: EventRow[];
  pairCodes: PairCodeRow[];
  pairFailures: PairFailureRow[];
}

export class FakeD1 implements D1Database {
  readonly state: FakeD1State = {
    users: [],
    homes: [],
    relaySecrets: [],
    events: [],
    pairCodes: [],
    pairFailures: [],
  };

  prepare(query: string): D1PreparedStatement {
    return new Statement(query, this.state);
  }

  async batch(stmts: D1PreparedStatement[]): Promise<unknown[]> {
    const results: unknown[] = [];
    for (const stmt of stmts) results.push(await stmt.run());
    return results;
  }
}
