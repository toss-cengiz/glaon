// Integration test for `LayoutsRepo` against a real MongoDB. Wired
// into the api-ci.yml `integration-tests` job (#422), which spins up
// a `mongo:7` service container and exports `MONGODB_URI` +
// `GLAON_API_INTEGRATION=1`. Skipped automatically outside CI so
// `pnpm --filter @glaon/api test` (the unit suite) doesn't try to
// reach a non-existent driver.

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { connect } from '../db';
import { LayoutsRepo } from './layouts-repo';

const SHOULD_RUN = process.env.GLAON_API_INTEGRATION === '1';
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017';
const MONGODB_DB = `${process.env.MONGODB_DB ?? 'glaon-integration'}-${String(process.pid)}`;

const describeIntegration = SHOULD_RUN ? describe : describe.skip;

describeIntegration('LayoutsRepo (integration)', () => {
  let close: (() => Promise<void>) | null = null;
  let repo: LayoutsRepo;

  beforeAll(async () => {
    const bundle = await connect(MONGODB_URI, MONGODB_DB);
    close = async () => {
      await bundle.client.close();
    };
    repo = new LayoutsRepo(bundle.db);
  });

  beforeEach(async () => {
    if (close === null) return;
    // Drop the collection between tests for isolation. Re-creating
    // the index is part of the next ensureIndex call.
    const bundle = await connect(MONGODB_URI, MONGODB_DB);
    try {
      await bundle.db.collection('layouts').deleteMany({});
    } finally {
      await bundle.client.close();
    }
  });

  afterAll(async () => {
    if (close !== null) await close();
  });

  it('round-trips a layout through create + getById', async () => {
    const created = await repo.create({
      id: 'layout-1',
      userId: 'user-A',
      homeId: 'home-1',
      name: 'Living room',
      payload: { rows: 2, theme: 'dark' },
      now: new Date('2026-05-10T00:00:00.000Z'),
    });
    expect(created.id).toBe('layout-1');
    expect(created.name).toBe('Living room');
    const fetched = await repo.getById('layout-1', 'user-A');
    expect(fetched).not.toBeNull();
    expect(fetched?.payload).toEqual({ rows: 2, theme: 'dark' });
  });

  it("lists only the requesting user's layouts", async () => {
    await repo.create({
      id: 'layout-mine',
      userId: 'user-A',
      homeId: 'home-1',
      name: 'Mine',
      payload: {},
      now: new Date(),
    });
    await repo.create({
      id: 'layout-yours',
      userId: 'user-B',
      homeId: 'home-1',
      name: 'Yours',
      payload: {},
      now: new Date(),
    });
    const listA = await repo.list('user-A');
    expect(listA.map((layout) => layout.id)).toEqual(['layout-mine']);
    const listB = await repo.list('user-B');
    expect(listB.map((layout) => layout.id)).toEqual(['layout-yours']);
  });

  it('soft-deletes a layout so it no longer appears in list / getById', async () => {
    await repo.create({
      id: 'soft',
      userId: 'user-A',
      homeId: 'home-1',
      name: 'Doomed',
      payload: {},
      now: new Date('2026-05-10T00:00:00.000Z'),
    });
    expect(await repo.softDelete('soft', 'user-A', new Date())).toBe(true);
    expect(await repo.getById('soft', 'user-A')).toBeNull();
    expect(await repo.list('user-A')).toHaveLength(0);
  });

  it('partial update preserves untouched fields', async () => {
    await repo.create({
      id: 'a',
      userId: 'user-A',
      homeId: 'home-1',
      name: 'Original',
      payload: { v: 1 },
      now: new Date('2026-05-10T00:00:00.000Z'),
    });
    const updated = await repo.update('a', 'user-A', {
      name: 'Renamed',
      now: new Date('2026-05-10T01:00:00.000Z'),
    });
    expect(updated?.name).toBe('Renamed');
    expect(updated?.payload).toEqual({ v: 1 });
  });

  it('homeId filter restricts the list', async () => {
    await repo.create({
      id: 'h1',
      userId: 'user-A',
      homeId: 'home-1',
      name: 'A',
      payload: {},
      now: new Date(),
    });
    await repo.create({
      id: 'h2',
      userId: 'user-A',
      homeId: 'home-2',
      name: 'B',
      payload: {},
      now: new Date(),
    });
    const result = await repo.list('user-A', { homeId: 'home-1' });
    expect(result.map((layout) => layout.id)).toEqual(['h1']);
  });
});
