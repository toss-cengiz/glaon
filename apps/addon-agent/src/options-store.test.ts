import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { FileOptionsStore, isPaired, type AddonOptions } from './options-store';

function makeStore(): { store: FileOptionsStore; dir: string; path: string } {
  const dir = mkdtempSync(join(tmpdir(), 'glaon-options-'));
  const path = join(dir, 'options.json');
  return { store: new FileOptionsStore(path), dir, path };
}

describe('FileOptionsStore', () => {
  it('returns empty object when file is missing', () => {
    const { store, dir } = makeStore();
    try {
      expect(store.read()).toEqual({});
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('round-trips options through write + read', () => {
    const { store, dir, path } = makeStore();
    try {
      const written: AddonOptions = {
        cloud_url: 'https://relay.glaon.app',
        home_id: 'home-abc',
        relay_secret: 'fake-test-value-AAAA',
      };
      store.write(written);
      expect(store.read()).toEqual(written);
      const stat = statSync(path);
      // mode 0o600 is the lower 9 bits of the mode field.
      expect(stat.mode & 0o777).toBe(0o600);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('overwrites existing fields atomically (no .tmp leftover)', () => {
    const { store, dir, path } = makeStore();
    try {
      store.write({ cloud_url: 'a', home_id: 'b', relay_secret: 'c' });
      store.write({ cloud_url: 'aa', home_id: 'bb', relay_secret: 'cc' });
      const raw = readFileSync(path, 'utf-8');
      expect(JSON.parse(raw)).toEqual({ cloud_url: 'aa', home_id: 'bb', relay_secret: 'cc' });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('returns empty object when JSON is malformed', () => {
    const { store, dir, path } = makeStore();
    try {
      // Write garbage directly bypassing the store API.
      writeFileSync(path, 'not json', { mode: 0o600 });
      expect(store.read()).toEqual({});
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('isPaired', () => {
  it('returns true when all three credential fields are non-empty strings', () => {
    expect(isPaired({ cloud_url: 'https://x', home_id: 'h', relay_secret: 's' })).toBe(true);
  });

  it('returns false when any field is missing', () => {
    expect(isPaired({})).toBe(false);
    expect(isPaired({ cloud_url: 'https://x' })).toBe(false);
    expect(isPaired({ cloud_url: 'https://x', home_id: 'h' })).toBe(false);
  });

  it('returns false when any field is empty', () => {
    expect(isPaired({ cloud_url: '', home_id: 'h', relay_secret: 's' })).toBe(false);
    expect(isPaired({ cloud_url: 'x', home_id: '', relay_secret: 's' })).toBe(false);
    expect(isPaired({ cloud_url: 'x', home_id: 'h', relay_secret: '' })).toBe(false);
  });
});
