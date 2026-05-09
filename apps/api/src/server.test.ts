import { describe, expect, it, vi } from 'vitest';

import { createServer, type ServerDeps } from './server';

import { InMemoryRevocationStore } from './auth/revocation';

function makeDeps(overrides: { dbCommand?: () => Promise<unknown> } = {}): ServerDeps {
  // The /layouts router mounted by createServer asks the Db for a
  // collection at construct time (and again to ensure indexes).
  // Server-level tests don't exercise /layouts; stub the collection
  // surface with no-op promises so the wiring doesn't blow up.
  const collection = {
    createIndex: () => Promise.resolve(),
    insertOne: () => Promise.resolve({ insertedId: 'x' }),
    find: () => ({ sort: () => ({ toArray: () => Promise.resolve([]) }) }),
    findOne: () => Promise.resolve(null),
    findOneAndUpdate: () => Promise.resolve(null),
    updateOne: () => Promise.resolve({ modifiedCount: 0, upsertedCount: 0 }),
  };
  const db = {
    command: overrides.dbCommand ?? (() => Promise.resolve({ ok: 1 })),
    collection: () => collection,
  } as unknown as ServerDeps['db'];
  const config: ServerDeps['config'] = {
    port: 8080,
    mongodbUri: 'mongodb://localhost:27017',
    mongodbDb: 'glaon-test',
    logLevel: 'info',
    sessionJwtSecret: 'a'.repeat(32),
    sessionTtlSeconds: 3600,
    webOrigins: [],
    buildInfo: {
      version: '0.0.0-test',
      commit: 'deadbeef',
      builtAt: '2026-05-09T00:00:00Z',
    },
  };
  return { db, config, revocations: new InMemoryRevocationStore() };
}

describe('GET /healthz', () => {
  it('returns 200 + ok when the Mongo ping resolves', async () => {
    const app = createServer(makeDeps());
    const res = await app.request('/healthz');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; mongo: { ok: boolean } };
    expect(body.status).toBe('ok');
    expect(body.mongo.ok).toBe(true);
  });

  it('returns 503 when the Mongo ping rejects', async () => {
    const app = createServer(
      makeDeps({ dbCommand: () => Promise.reject(new Error('disconnect')) }),
    );
    const res = await app.request('/healthz');
    expect(res.status).toBe(503);
    const body = (await res.json()) as { status: string; mongo: { ok: boolean } };
    expect(body.status).toBe('degraded');
    expect(body.mongo.ok).toBe(false);
  });

  it('returns 503 when the Mongo command resolves without ok=1', async () => {
    const app = createServer(makeDeps({ dbCommand: () => Promise.resolve({ ok: 0 }) }));
    const res = await app.request('/healthz');
    expect(res.status).toBe(503);
  });
});

describe('GET /version', () => {
  it('returns the build info from config', async () => {
    const app = createServer(makeDeps());
    const res = await app.request('/version');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      version: '0.0.0-test',
      commit: 'deadbeef',
      builtAt: '2026-05-09T00:00:00Z',
    });
  });
});

describe('createServer wiring', () => {
  it('passes the same Db instance to every route handler', async () => {
    const command = vi.fn(() => Promise.resolve({ ok: 1 }));
    const app = createServer(makeDeps({ dbCommand: command }));
    await app.request('/healthz');
    await app.request('/healthz');
    expect(command).toHaveBeenCalledTimes(2);
  });
});
