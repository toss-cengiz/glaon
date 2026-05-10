// Integration test for `UsersRepo` against a real MongoDB. Same gating
// as the layouts integration test: skipped outside the CI integration
// job that exports `GLAON_API_INTEGRATION=1`.

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { connect } from '../db';
import { UsersRepo } from './users-repo';

const SHOULD_RUN = process.env.GLAON_API_INTEGRATION === '1';
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017';
const MONGODB_DB = `${process.env.MONGODB_DB ?? 'glaon-integration'}-${String(process.pid)}`;

const describeIntegration = SHOULD_RUN ? describe : describe.skip;

describeIntegration('UsersRepo (integration)', () => {
  let close: (() => Promise<void>) | null = null;
  let repo: UsersRepo;

  beforeAll(async () => {
    const bundle = await connect(MONGODB_URI, MONGODB_DB);
    close = async () => {
      await bundle.client.close();
    };
    repo = new UsersRepo(bundle.db);
  });

  beforeEach(async () => {
    if (close === null) return;
    const bundle = await connect(MONGODB_URI, MONGODB_DB);
    try {
      await bundle.db.collection('users').deleteMany({});
    } finally {
      await bundle.client.close();
    }
  });

  afterAll(async () => {
    if (close !== null) await close();
  });

  it('returns default preferences for an unknown user', async () => {
    expect(await repo.getPreferences('user-A')).toEqual({ locale: null });
  });

  it('upserts preferences on first update + reads them back', async () => {
    const now = new Date('2026-05-10T00:00:00.000Z');
    expect(await repo.updatePreferences('user-A', { locale: 'tr' }, now)).toEqual({ locale: 'tr' });
    expect(await repo.getPreferences('user-A')).toEqual({ locale: 'tr' });
  });

  it('partial update leaves untouched fields alone', async () => {
    const now = new Date();
    await repo.updatePreferences('user-A', { locale: 'tr' }, now);
    expect(await repo.updatePreferences('user-A', {}, now)).toEqual({ locale: 'tr' });
  });

  it('null clears the persisted locale', async () => {
    const now = new Date();
    await repo.updatePreferences('user-A', { locale: 'tr' }, now);
    expect(await repo.updatePreferences('user-A', { locale: null }, now)).toEqual({
      locale: null,
    });
    expect(await repo.getPreferences('user-A')).toEqual({ locale: null });
  });

  it('preferences are isolated per user', async () => {
    const now = new Date();
    await repo.updatePreferences('user-A', { locale: 'tr' }, now);
    await repo.updatePreferences('user-B', { locale: 'en' }, now);
    expect(await repo.getPreferences('user-A')).toEqual({ locale: 'tr' });
    expect(await repo.getPreferences('user-B')).toEqual({ locale: 'en' });
  });
});
