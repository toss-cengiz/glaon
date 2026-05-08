import { afterEach, describe, expect, it } from 'vitest';

import { clearModePreference, readModePreference, writeModePreference } from './mode-preference';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

describe('mode-preference', () => {
  let storage: MemoryStorage;

  afterEach(() => {
    storage = new MemoryStorage();
  });

  it('returns null when nothing is stored', () => {
    storage = new MemoryStorage();
    expect(readModePreference(storage)).toBeNull();
  });

  it('round-trips a local preference with lastLocalUrl', () => {
    storage = new MemoryStorage();
    writeModePreference(
      { mode: 'local', lastLocalUrl: 'http://homeassistant.local:8123' },
      storage,
    );
    expect(readModePreference(storage)).toEqual({
      mode: 'local',
      lastLocalUrl: 'http://homeassistant.local:8123',
    });
  });

  it('round-trips a cloud preference without lastLocalUrl', () => {
    storage = new MemoryStorage();
    writeModePreference({ mode: 'cloud' }, storage);
    expect(readModePreference(storage)).toEqual({ mode: 'cloud' });
  });

  it('returns null for malformed JSON', () => {
    storage = new MemoryStorage();
    storage.setItem('glaon.mode-preference', '{malformed');
    expect(readModePreference(storage)).toBeNull();
  });

  it('returns null when the stored mode is unrecognized', () => {
    storage = new MemoryStorage();
    storage.setItem('glaon.mode-preference', JSON.stringify({ mode: 'pirate' }));
    expect(readModePreference(storage)).toBeNull();
  });

  it('clearModePreference removes the entry', () => {
    storage = new MemoryStorage();
    writeModePreference({ mode: 'cloud' }, storage);
    clearModePreference(storage);
    expect(readModePreference(storage)).toBeNull();
  });
});
