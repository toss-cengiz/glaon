// Session JWT revocation list — backed by a small Mongo collection
// (`session_revocations`) keyed by jti. Logout adds the jti; the
// require-session middleware checks it on every request. The collection
// uses a TTL index so entries auto-purge after the JWT's natural exp.

import type { Collection, Db } from 'mongodb';

interface RevocationDoc {
  readonly _id: string;
  readonly userId: string;
  readonly revokedAt: number;
  readonly expiresAt: Date;
}

export interface RevocationStore {
  revoke(jti: string, userId: string, expSeconds: number): Promise<void>;
  isRevoked(jti: string): Promise<boolean>;
}

export class MongoRevocationStore implements RevocationStore {
  private collection: Collection<RevocationDoc>;
  private indexEnsured = false;

  constructor(db: Db) {
    this.collection = db.collection<RevocationDoc>('session_revocations');
  }

  async revoke(jti: string, userId: string, expSeconds: number): Promise<void> {
    await this.ensureIndex();
    await this.collection.updateOne(
      { _id: jti },
      {
        $setOnInsert: {
          userId,
          revokedAt: Date.now(),
          expiresAt: new Date(expSeconds * 1000),
        },
      },
      { upsert: true },
    );
  }

  async isRevoked(jti: string): Promise<boolean> {
    const doc = await this.collection.findOne({ _id: jti });
    return doc !== null;
  }

  // Mongo prunes documents whose `expiresAt` has passed when the
  // background TTL monitor next runs (default every 60s). We index
  // exactly once per process — repeated calls are cheap.
  private async ensureIndex(): Promise<void> {
    if (this.indexEnsured) return;
    await this.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    this.indexEnsured = true;
  }
}

// In-memory fallback for unit tests + the dev path where Mongo isn't
// available. Loses entries on restart, which is fine for a test.
export class InMemoryRevocationStore implements RevocationStore {
  private readonly entries = new Map<string, number>();

  async revoke(jti: string, _userId: string, expSeconds: number): Promise<void> {
    this.entries.set(jti, expSeconds * 1000);
    await Promise.resolve();
  }

  async isRevoked(jti: string): Promise<boolean> {
    const expiresAt = this.entries.get(jti);
    await Promise.resolve();
    if (expiresAt === undefined) return false;
    if (expiresAt < Date.now()) {
      this.entries.delete(jti);
      return false;
    }
    return true;
  }
}
