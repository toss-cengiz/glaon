import { describe, expect, it, vi } from 'vitest';

import type {
  CloudSessionCredential,
  HaAccessCredential,
  HaRefreshCredential,
} from '@glaon/core/auth';

import { WebTokenStore } from './web-token-store';

const haAccess: HaAccessCredential = {
  kind: 'ha-access',
  token: 'access-1',
  expiresAt: 1_000,
};

const haRefresh: HaRefreshCredential = {
  kind: 'ha-refresh',
  token: 'refresh-1',
};

const cloudSession: CloudSessionCredential = {
  kind: 'cloud-session',
  token: 'session-1',
  expiresAt: 2_000,
};

describe('WebTokenStore — in-memory slots (ha-access, cloud-session)', () => {
  it('round-trips ha-access in memory', async () => {
    const store = new WebTokenStore();
    await store.set(haAccess);
    expect(await store.get('ha-access')).toEqual(haAccess);
  });

  it('round-trips cloud-session in memory', async () => {
    const store = new WebTokenStore();
    await store.set(cloudSession);
    expect(await store.get('cloud-session')).toEqual(cloudSession);
  });

  it('clear(ha-access) removes only ha-access', async () => {
    const store = new WebTokenStore();
    await store.set(haAccess);
    await store.set(cloudSession);
    await store.clear('ha-access');
    expect(await store.get('ha-access')).toBeNull();
    expect(await store.get('cloud-session')).toEqual(cloudSession);
  });
});

describe('WebTokenStore — ha-refresh slot (httpOnly cookie boundary)', () => {
  it('get(ha-refresh) always resolves null even after set()', async () => {
    const store = new WebTokenStore();
    await store.set(haRefresh);
    expect(await store.get('ha-refresh')).toBeNull();
  });

  it('set(ha-refresh) is a no-op (nginx proxy already set the cookie)', async () => {
    const fetchImpl = vi.fn();
    const store = new WebTokenStore({ logoutEndpoint: '/auth/logout', fetchImpl });
    await store.set(haRefresh);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('clear(ha-refresh) POSTs to logoutEndpoint with credentials: include', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response());
    const store = new WebTokenStore({ logoutEndpoint: '/auth/logout', fetchImpl });

    await store.clear('ha-refresh');

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith('/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  });

  it('clear(ha-refresh) without logoutEndpoint is a documented no-op', async () => {
    const fetchImpl = vi.fn();
    const store = new WebTokenStore({ fetchImpl });
    await store.clear('ha-refresh');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('clear() with no argument empties memory + requests cookie clear', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response());
    const store = new WebTokenStore({ logoutEndpoint: '/auth/logout', fetchImpl });
    await store.set(haAccess);
    await store.set(cloudSession);

    await store.clear();

    expect(await store.get('ha-access')).toBeNull();
    expect(await store.get('cloud-session')).toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe('WebTokenStore — storage-leak invariants', () => {
  it('does not touch localStorage during set/get/clear', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem');

    const store = new WebTokenStore({
      logoutEndpoint: '/auth/logout',
      fetchImpl: vi.fn().mockResolvedValue(new Response()),
    });
    await store.set(haAccess);
    await store.set(haRefresh);
    await store.set(cloudSession);
    await store.get('ha-access');
    await store.get('ha-refresh');
    await store.get('cloud-session');
    await store.clear();

    expect(setItem).not.toHaveBeenCalled();
    expect(getItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();

    setItem.mockRestore();
    getItem.mockRestore();
    removeItem.mockRestore();
  });
});
