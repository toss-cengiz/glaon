// Pairing-flow repo per ADR 0021. Codes mint at /pair/initiate, get consumed by
// /pair/claim. Single-use + 10min TTL enforced here; brute-force lockout sits
// alongside on the same DB.

import type { D1Database } from './types';

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

export class PairCodeRepo {
  constructor(private readonly db: D1Database) {}

  async insertCode(
    code: string,
    clerkUserId: string,
    createdAt: number,
    expiresAt: number,
  ): Promise<void> {
    await this.db
      .prepare(
        'INSERT INTO pair_codes (code, clerk_user_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
      )
      .bind(code, clerkUserId, createdAt, expiresAt)
      .run();
  }

  async findByCode(code: string): Promise<PairCodeRow | null> {
    return (await this.db
      .prepare(
        'SELECT id, code, clerk_user_id, created_at, expires_at, claimed_at, claimed_home_id FROM pair_codes WHERE code = ?',
      )
      .bind(code)
      .first()) as PairCodeRow | null;
  }

  async findByCodeAndUser(code: string, clerkUserId: string): Promise<PairCodeRow | null> {
    return (await this.db
      .prepare(
        'SELECT id, code, clerk_user_id, created_at, expires_at, claimed_at, claimed_home_id FROM pair_codes WHERE code = ? AND clerk_user_id = ?',
      )
      .bind(code, clerkUserId)
      .first()) as PairCodeRow | null;
  }

  /**
   * Atomic-style claim: only flips claimed_at when the row is still pending and
   * not expired. Caller checks the affected row count via a follow-up read.
   * SQLite (D1) has no UPDATE...RETURNING here, so we update + re-read.
   */
  async claimCode(code: string, homeId: string, now: number): Promise<boolean> {
    await this.db
      .prepare(
        'UPDATE pair_codes SET claimed_at = ?, claimed_home_id = ? WHERE code = ? AND claimed_at IS NULL AND expires_at > ?',
      )
      .bind(now, homeId, code, now)
      .run();
    const updated = await this.findByCode(code);
    return updated !== null && updated.claimed_at === now && updated.claimed_home_id === homeId;
  }

  /* ---------------- failure / rate limit ---------------- */

  async getFailure(ip: string): Promise<PairFailureRow | null> {
    return (await this.db
      .prepare('SELECT ip, attempts, locked_until FROM pair_failure_attempts WHERE ip = ?')
      .bind(ip)
      .first()) as PairFailureRow | null;
  }

  async recordFailure(ip: string, attempts: number, lockedUntil: number | null): Promise<void> {
    const existing = await this.getFailure(ip);
    if (existing === null) {
      await this.db
        .prepare('INSERT INTO pair_failure_attempts (ip, attempts, locked_until) VALUES (?, ?, ?)')
        .bind(ip, attempts, lockedUntil)
        .run();
    } else {
      await this.db
        .prepare('UPDATE pair_failure_attempts SET attempts = ?, locked_until = ? WHERE ip = ?')
        .bind(attempts, lockedUntil, ip)
        .run();
    }
  }

  async clearFailure(ip: string): Promise<void> {
    await this.db.prepare('DELETE FROM pair_failure_attempts WHERE ip = ?').bind(ip).run();
  }
}
