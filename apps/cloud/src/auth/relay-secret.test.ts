import { hash } from 'bcryptjs';
import { describe, expect, it } from 'vitest';

import type { D1Database, D1PreparedStatement } from '../db/types';

import { RelaySecretVerifier } from './relay-secret';

class StubDb implements D1Database {
  constructor(private readonly hashByHome: Record<string, string>) {}

  prepare(query: string): D1PreparedStatement {
    if (!query.startsWith('SELECT hash FROM relay_secrets_hash')) {
      throw new Error(`unsupported: ${query}`);
    }
    const captured: { homeId?: string } = {};
    const stmt: D1PreparedStatement = {
      bind: (...args: unknown[]) => {
        captured.homeId = args[0] as string;
        return stmt;
      },
      first: () => {
        if (captured.homeId === undefined) return Promise.resolve(null);
        const value = this.hashByHome[captured.homeId];
        if (value === undefined) return Promise.resolve(null);
        return Promise.resolve({ hash: value });
      },
      all: () => Promise.resolve({ results: [] }),
      run: () => Promise.resolve({ success: true }),
    };
    return stmt;
  }

  batch(): Promise<unknown[]> {
    return Promise.resolve([]);
  }
}

describe('RelaySecretVerifier', () => {
  it('returns true for the matching plaintext secret', async () => {
    const secret = 'super-secret';
    const stored = await hash(secret, 4);
    const verifier = new RelaySecretVerifier(new StubDb({ 'home-1': stored }));
    await expect(verifier.verify('home-1', secret)).resolves.toBe(true);
  });

  it('returns false for a mismatched secret', async () => {
    const stored = await hash('one', 4);
    const verifier = new RelaySecretVerifier(new StubDb({ 'home-1': stored }));
    await expect(verifier.verify('home-1', 'two')).resolves.toBe(false);
  });

  it('returns false when the home has no stored hash', async () => {
    const verifier = new RelaySecretVerifier(new StubDb({}));
    await expect(verifier.verify('missing', 'whatever')).resolves.toBe(false);
  });
});
