import { describe, expect, it, vi } from 'vitest';

import type { HaClient } from '../ha/client';
import {
  clearHaTranslationsCache,
  fetchHaTranslations,
  invalidateHaTranslations,
  type HaTranslationsCache,
} from './ha-bridge';

function inMemoryCache(): HaTranslationsCache {
  const store = new Map<string, Readonly<Record<string, string>>>();
  return {
    get: (k) => store.get(k),
    set: (k, v) => {
      store.set(k, v);
    },
    delete: (k) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
  };
}

function fakeClient(resources: Record<string, string>): { client: HaClient; calls: number } {
  let calls = 0;
  const client = {
    request: vi.fn(async () => {
      calls += 1;
      return Promise.resolve({ resources });
    }),
  } as unknown as HaClient;
  return {
    client,
    get calls() {
      return calls;
    },
  };
}

describe('fetchHaTranslations', () => {
  it('returns the flat dictionary HA serves on frontend/get_translations', async () => {
    const cache = inMemoryCache();
    const { client } = fakeClient({ 'component.switch.state.off': 'Off' });
    expect(await fetchHaTranslations(client, 'en', { cache })).toEqual({
      'component.switch.state.off': 'Off',
    });
  });

  it('caches by locale + category — second call hits the cache', async () => {
    const cache = inMemoryCache();
    const fc = fakeClient({ k: 'v' });
    await fetchHaTranslations(fc.client, 'en', { cache });
    await fetchHaTranslations(fc.client, 'en', { cache });
    expect(fc.calls).toBe(1);
  });

  it('refresh: true bypasses the cache and overwrites the entry', async () => {
    const cache = inMemoryCache();
    const fc = fakeClient({ k: 'v1' });
    await fetchHaTranslations(fc.client, 'en', { cache });
    await fetchHaTranslations(fc.client, 'en', { cache, refresh: true });
    expect(fc.calls).toBe(2);
  });

  it('different locales are isolated in the cache', async () => {
    const cache = inMemoryCache();
    const fc = fakeClient({ k: 'v' });
    await fetchHaTranslations(fc.client, 'en', { cache });
    await fetchHaTranslations(fc.client, 'tr', { cache });
    expect(fc.calls).toBe(2);
  });

  it('different categories are isolated in the cache', async () => {
    const cache = inMemoryCache();
    const fc = fakeClient({ k: 'v' });
    await fetchHaTranslations(fc.client, 'en', { cache, category: 'state' });
    await fetchHaTranslations(fc.client, 'en', { cache, category: 'entity_component' });
    expect(fc.calls).toBe(2);
  });

  it('tolerates an HA response missing the resources field', async () => {
    const cache = inMemoryCache();
    const client = {
      request: vi.fn(async () => Promise.resolve({})),
    } as unknown as HaClient;
    expect(await fetchHaTranslations(client, 'en', { cache })).toEqual({});
  });
});

describe('invalidateHaTranslations', () => {
  it('drops a single locale/category pair', async () => {
    const cache = inMemoryCache();
    const fc = fakeClient({ k: 'v' });
    await fetchHaTranslations(fc.client, 'en', { cache });
    invalidateHaTranslations('en', { cache });
    await fetchHaTranslations(fc.client, 'en', { cache });
    expect(fc.calls).toBe(2);
  });

  it('does not affect other locales / categories', async () => {
    const cache = inMemoryCache();
    const fc = fakeClient({ k: 'v' });
    await fetchHaTranslations(fc.client, 'en', { cache });
    await fetchHaTranslations(fc.client, 'tr', { cache });
    invalidateHaTranslations('en', { cache });
    await fetchHaTranslations(fc.client, 'tr', { cache });
    expect(fc.calls).toBe(2);
  });
});

describe('clearHaTranslationsCache', () => {
  it('drops every entry', async () => {
    const cache = inMemoryCache();
    const fc = fakeClient({ k: 'v' });
    await fetchHaTranslations(fc.client, 'en', { cache });
    await fetchHaTranslations(fc.client, 'tr', { cache });
    clearHaTranslationsCache(cache);
    await fetchHaTranslations(fc.client, 'en', { cache });
    await fetchHaTranslations(fc.client, 'tr', { cache });
    expect(fc.calls).toBe(4);
  });
});
