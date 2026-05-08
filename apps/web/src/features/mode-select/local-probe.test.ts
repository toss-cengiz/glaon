import { describe, expect, it, vi } from 'vitest';

import { probeLocal } from './local-probe';

describe('probeLocal', () => {
  it('returns reachable=true for a 200 response', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response('{}', { status: 200 })),
    ) as unknown as typeof fetch;
    const result = await probeLocal('http://homeassistant.local:8123', { fetchImpl });
    expect(result).toEqual({
      reachable: true,
      url: 'http://homeassistant.local:8123',
      status: 200,
    });
  });

  it('returns reachable=false for a non-2xx response', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response('nope', { status: 503 })),
    ) as unknown as typeof fetch;
    const result = await probeLocal('http://h:8123', { fetchImpl });
    expect(result).toEqual({ reachable: false, url: 'http://h:8123', status: 503 });
  });

  it('returns reachable=false when fetch throws (network / cors)', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.reject(new TypeError('network')),
    ) as unknown as typeof fetch;
    const result = await probeLocal('http://h:8123', { fetchImpl });
    expect(result).toEqual({ reachable: false, url: 'http://h:8123' });
  });

  it('strips a trailing slash before composing the discovery URL', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response('{}', { status: 200 })),
    ) as unknown as typeof fetch;
    await probeLocal('http://h:8123/', { fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://h:8123/api/discovery_info',
      expect.objectContaining({ mode: 'cors', credentials: 'omit' }),
    );
  });
});
