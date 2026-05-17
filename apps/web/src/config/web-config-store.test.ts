import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEVICE_CONFIG_SCHEMA_VERSION, DEVICE_CONFIG_STORAGE_KEY } from '@glaon/core/config';

import { LocalStorageBackend, WebConfigStore } from './web-config-store';

describe('LocalStorageBackend', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('round-trips a value through window.localStorage', async () => {
    const backend = new LocalStorageBackend();
    await backend.set('key', 'value');
    expect(await backend.get('key')).toBe('value');
  });

  it('returns null for an absent key', async () => {
    const backend = new LocalStorageBackend();
    expect(await backend.get('missing')).toBeNull();
  });

  it('delete() removes the key', async () => {
    const backend = new LocalStorageBackend();
    await backend.set('key', 'value');
    await backend.delete('key');
    expect(await backend.get('key')).toBeNull();
  });
});

describe('WebConfigStore (async path through KeyValueConfigStore)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('persists setPartial output to localStorage under the device-config key', async () => {
    const store = new WebConfigStore();
    await store.setPartial({ homeName: 'Olivia', country: 'TR' });
    const raw = window.localStorage.getItem(DEVICE_CONFIG_STORAGE_KEY);
    expect(raw).toBeDefined();
    expect(JSON.parse(raw ?? '{}')).toEqual({
      schemaVersion: DEVICE_CONFIG_SCHEMA_VERSION,
      homeName: 'Olivia',
      country: 'TR',
    });
  });

  it('round-trips through a fresh store instance (cross-reload simulation)', async () => {
    const writer = new WebConfigStore();
    await writer.setPartial({ homeName: 'Olivia' });
    await writer.markComplete();

    const reader = new WebConfigStore();
    const blob = await reader.get();
    expect(blob?.homeName).toBe('Olivia');
    expect(await reader.isConfigured()).toBe(true);
  });

  it('clear() removes the device-config key', async () => {
    const store = new WebConfigStore();
    await store.setPartial({ homeName: 'Olivia' });
    await store.clear();
    expect(window.localStorage.getItem(DEVICE_CONFIG_STORAGE_KEY)).toBeNull();
  });

  it('async get() clears a corrupt JSON blob and returns null', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    window.localStorage.setItem(DEVICE_CONFIG_STORAGE_KEY, 'not-json{');
    const store = new WebConfigStore();
    expect(await store.get()).toBeNull();
    expect(window.localStorage.getItem(DEVICE_CONFIG_STORAGE_KEY)).toBeNull();
  });
});

describe('WebConfigStore.peekSync', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns null when the key is absent', () => {
    const store = new WebConfigStore();
    expect(store.peekSync()).toBeNull();
  });

  it('returns the parsed blob when valid', async () => {
    const writer = new WebConfigStore();
    await writer.setPartial({ homeName: 'Olivia', country: 'TR' });
    await writer.markComplete();

    const reader = new WebConfigStore();
    const blob = reader.peekSync();
    expect(blob?.homeName).toBe('Olivia');
    expect(blob?.completedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('returns null on invalid JSON without clearing the key', () => {
    window.localStorage.setItem(DEVICE_CONFIG_STORAGE_KEY, 'not-json{');
    const store = new WebConfigStore();
    expect(store.peekSync()).toBeNull();
    expect(window.localStorage.getItem(DEVICE_CONFIG_STORAGE_KEY)).toBe('not-json{');
  });

  it('returns null on schema mismatch without clearing the key', () => {
    window.localStorage.setItem(
      DEVICE_CONFIG_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 99, mystery: true }),
    );
    const store = new WebConfigStore();
    expect(store.peekSync()).toBeNull();
    expect(window.localStorage.getItem(DEVICE_CONFIG_STORAGE_KEY)).toBeTruthy();
  });
});
