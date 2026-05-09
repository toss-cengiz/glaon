// Mongo client wrapper — thin layer around the native driver per ADR 0025.
// Exposes:
//   - `connect(uri, db)`: opens the singleton client + returns `{ client, db }`
//   - `pingDb(db)`: lightweight health probe (admin command 'ping')
//
// The HTTP layer treats the client as a long-lived dependency; tests can
// inject a `Db` with the same shape via `MongoMemoryServer` or a stub.

import { MongoClient, type Db } from 'mongodb';

interface MongoBundle {
  readonly client: MongoClient;
  readonly db: Db;
}

export async function connect(uri: string, dbName: string): Promise<MongoBundle> {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5_000,
  });
  await client.connect();
  return { client, db: client.db(dbName) };
}

export async function pingDb(db: Db): Promise<{ ok: boolean; latencyMs: number }> {
  const started = Date.now();
  try {
    const result = (await db.command({ ping: 1 })) as { ok?: number };
    return { ok: result.ok === 1, latencyMs: Date.now() - started };
  } catch {
    return { ok: false, latencyMs: Date.now() - started };
  }
}
