import { describe, expect, it, vi } from 'vitest';

import { RefreshMutex } from './refresh-mutex';
import {
  InMemoryTokenStore,
  KeyValueTokenStore,
  assertSlotTag,
  type CloudSessionCredential,
  type HaAccessCredential,
  type HaRefreshCredential,
  type KeyValueBackend,
  type StoredCredential,
} from './token-store';

const haAccess: HaAccessCredential = {
  kind: 'ha-access',
  token: 'access-1',
  expiresAt: 1_000_000,
};

const haRefresh: HaRefreshCredential = {
  kind: 'ha-refresh',
  token: 'refresh-1',
};

const cloudSession: CloudSessionCredential = {
  kind: 'cloud-session',
  token: 'session-1',
  expiresAt: 2_000_000,
};

describe('InMemoryTokenStore', () => {
  it('round-trips each slot independently', async () => {
    const store = new InMemoryTokenStore();
    await store.set(haAccess);
    await store.set(haRefresh);
    await store.set(cloudSession);

    expect(await store.get('ha-access')).toEqual(haAccess);
    expect(await store.get('ha-refresh')).toEqual(haRefresh);
    expect(await store.get('cloud-session')).toEqual(cloudSession);
  });

  it('returns null for empty slots', async () => {
    const store = new InMemoryTokenStore();
    expect(await store.get('ha-access')).toBeNull();
    expect(await store.get('ha-refresh')).toBeNull();
    expect(await store.get('cloud-session')).toBeNull();
  });

  it('clear(kind) removes only the named slot', async () => {
    const store = new InMemoryTokenStore();
    await store.set(haAccess);
    await store.set(haRefresh);

    await store.clear('ha-access');

    expect(await store.get('ha-access')).toBeNull();
    expect(await store.get('ha-refresh')).toEqual(haRefresh);
  });

  it('clear() with no argument empties every slot', async () => {
    const store = new InMemoryTokenStore();
    await store.set(haAccess);
    await store.set(haRefresh);
    await store.set(cloudSession);

    await store.clear();

    expect(await store.get('ha-access')).toBeNull();
    expect(await store.get('ha-refresh')).toBeNull();
    expect(await store.get('cloud-session')).toBeNull();
  });

  it('overwrites existing credentials in the same slot', async () => {
    const store = new InMemoryTokenStore();
    await store.set(haAccess);
    const newer: HaAccessCredential = { kind: 'ha-access', token: 'access-2', expiresAt: 9 };
    await store.set(newer);

    expect(await store.get('ha-access')).toEqual(newer);
  });
});

describe('cross-slot leak guard', () => {
  it('assertSlotTag throws when stored credential disagrees with requested slot', () => {
    const tampered = { kind: 'cloud-session', token: 'x', expiresAt: 0 } as StoredCredential;
    expect(() => {
      assertSlotTag(tampered, 'ha-access');
    }).toThrow(/cross-slot leak/i);
  });

  it('InMemoryTokenStore surfaces tampering through assertSlotTag', async () => {
    const store = new InMemoryTokenStore();
    // Bypass set() so the internal map carries the wrong tag for the slot — simulates a
    // tampered SecureStore entry on mobile.
    const internal = store as unknown as { slots: Map<string, StoredCredential> };
    internal.slots.set('ha-access', cloudSession);

    await expect(store.get('ha-access')).rejects.toThrow(/cross-slot leak/i);
  });
});

describe('KeyValueTokenStore', () => {
  function makeMockBackend(): KeyValueBackend & { state: Map<string, string> } {
    const state = new Map<string, string>();
    return {
      state,
      get(key) {
        return Promise.resolve(state.get(key) ?? null);
      },
      set(key, value) {
        state.set(key, value);
        return Promise.resolve();
      },
      delete(key) {
        state.delete(key);
        return Promise.resolve();
      },
    };
  }

  it('serializes credentials per slot under stable keys', async () => {
    const backend = makeMockBackend();
    const store = new KeyValueTokenStore(backend);

    await store.set(haAccess);
    await store.set(haRefresh);
    await store.set(cloudSession);

    expect([...backend.state.keys()].sort()).toEqual([
      'glaon.token.cloud-session',
      'glaon.token.ha-access',
      'glaon.token.ha-refresh',
    ]);
    const stored = backend.state.get('glaon.token.ha-access');
    expect(stored).toBeDefined();
    expect(JSON.parse(stored ?? '{}')).toEqual(haAccess);
  });

  it('round-trips each slot through the backend', async () => {
    const store = new KeyValueTokenStore(makeMockBackend());
    await store.set(haAccess);
    await store.set(haRefresh);
    await store.set(cloudSession);

    expect(await store.get('ha-access')).toEqual(haAccess);
    expect(await store.get('ha-refresh')).toEqual(haRefresh);
    expect(await store.get('cloud-session')).toEqual(cloudSession);
  });

  it('returns null for missing slots', async () => {
    const store = new KeyValueTokenStore(makeMockBackend());
    expect(await store.get('ha-access')).toBeNull();
  });

  it('throws on tampered backend value (cross-slot leak)', async () => {
    const backend = makeMockBackend();
    const store = new KeyValueTokenStore(backend);
    backend.state.set('glaon.token.ha-access', JSON.stringify(cloudSession));

    await expect(store.get('ha-access')).rejects.toThrow(/cross-slot leak/i);
  });

  it('clear(kind) deletes only the named backend key', async () => {
    const backend = makeMockBackend();
    const store = new KeyValueTokenStore(backend);
    await store.set(haAccess);
    await store.set(haRefresh);

    await store.clear('ha-access');

    expect(backend.state.has('glaon.token.ha-access')).toBe(false);
    expect(backend.state.has('glaon.token.ha-refresh')).toBe(true);
  });

  it('clear() with no argument deletes every slot key', async () => {
    const backend = makeMockBackend();
    const store = new KeyValueTokenStore(backend);
    await store.set(haAccess);
    await store.set(haRefresh);
    await store.set(cloudSession);

    await store.clear();

    expect(backend.state.size).toBe(0);
  });
});

describe('RefreshMutex', () => {
  it('coalesces concurrent refreshes for the same slot to one round-trip', async () => {
    const mutex = new RefreshMutex();
    const refresh = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve('fresh');
          }, 10);
        }),
    );

    const [a, b, c] = await Promise.all([
      mutex.run('ha-access', refresh),
      mutex.run('ha-access', refresh),
      mutex.run('ha-access', refresh),
    ]);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect([a, b, c]).toEqual(['fresh', 'fresh', 'fresh']);
  });

  it('runs refreshes for different slots in parallel', async () => {
    const mutex = new RefreshMutex();
    const haRefreshFn = vi.fn().mockResolvedValue('ha');
    const cloudRefreshFn = vi.fn().mockResolvedValue('cloud');

    await Promise.all([
      mutex.run('ha-access', haRefreshFn),
      mutex.run('cloud-session', cloudRefreshFn),
    ]);

    expect(haRefreshFn).toHaveBeenCalledTimes(1);
    expect(cloudRefreshFn).toHaveBeenCalledTimes(1);
  });

  it('clears the in-flight slot after the refresh settles, so a later refresh runs', async () => {
    const mutex = new RefreshMutex();
    const refresh = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');

    const first = await mutex.run('ha-access', refresh);
    const second = await mutex.run('ha-access', refresh);

    expect(refresh).toHaveBeenCalledTimes(2);
    expect(first).toBe('first');
    expect(second).toBe('second');
    expect(mutex.inFlightCount).toBe(0);
  });

  it('clears the in-flight slot after a refresh rejects', async () => {
    const mutex = new RefreshMutex();
    const refresh = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('recovered');

    await expect(mutex.run('ha-access', refresh)).rejects.toThrow('boom');
    const recovered = await mutex.run('ha-access', refresh);

    expect(recovered).toBe('recovered');
    expect(mutex.inFlightCount).toBe(0);
  });
});
