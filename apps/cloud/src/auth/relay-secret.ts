// Relay secret verification per ADR 0021. Addons send `Authorization: Bearer
// <relay_secret>`; the relay looks up `relay_secrets_hash` for the home and
// compares with bcrypt.

import { compare } from 'bcryptjs';

import type { D1Database } from '../db/types';

interface RelaySecretRow {
  hash: string;
}

export class RelaySecretVerifier {
  constructor(private readonly db: D1Database) {}

  /**
   * Returns true iff the given secret matches the stored bcrypt hash for the
   * home. False on missing row, mismatched hash, or invalid bcrypt input.
   */
  async verify(homeId: string, secret: string): Promise<boolean> {
    const row = (await this.db
      .prepare('SELECT hash FROM relay_secrets_hash WHERE home_id = ?')
      .bind(homeId)
      .first()) as RelaySecretRow | null;
    if (row === null) return false;
    try {
      return await compare(secret, row.hash);
    } catch {
      return false;
    }
  }
}
