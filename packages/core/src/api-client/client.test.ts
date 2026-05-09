import { describe, expect, it, vi } from 'vitest';

import { ApiClient } from './client';
import { ApiError, ApiNetworkError } from './errors';

function makeFetch(
  responder: (input: string, init?: RequestInit) => Response | Promise<Response>,
): typeof fetch {
  const impl = vi.fn(async (input: string, init?: RequestInit) => responder(input, init));
  return impl as unknown as typeof fetch;
}

const BASE = 'https://api.glaon.test';

describe('ApiClient — exchange', () => {
  it('parses a successful response', async () => {
    const fetchImpl = makeFetch(() =>
      Promise.resolve(
        new Response(JSON.stringify({ sessionJwt: 'a.b.c', expiresAt: 1_700_000_000_000 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    const client = new ApiClient({ baseUrl: BASE, fetchImpl });
    const result = await client.exchange({
      haAccessToken: 'tok',
      haBaseUrl: 'http://homeassistant.local:8123',
    });
    expect(result).toEqual({ sessionJwt: 'a.b.c', expiresAt: 1_700_000_000_000 });
  });

  it('rejects bad request bodies before sending', async () => {
    const fetchImpl = makeFetch(() => new Response());
    const client = new ApiClient({ baseUrl: BASE, fetchImpl });
    await expect(client.exchange({ haAccessToken: '', haBaseUrl: 'not-a-url' })).rejects.toThrow();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('does not attach an Authorization header (skipAuth path)', async () => {
    let captured: RequestInit | undefined;
    const fetchImpl = makeFetch((_input, init) => {
      captured = init;
      return Promise.resolve(
        new Response(JSON.stringify({ sessionJwt: 'x', expiresAt: 1 }), { status: 200 }),
      );
    });
    const client = new ApiClient({
      baseUrl: BASE,
      fetchImpl,
      getSessionJwt: () => 'should-not-be-used',
    });
    await client.exchange({
      haAccessToken: 'tok',
      haBaseUrl: 'http://h',
    });
    const headers = (captured?.headers ?? {}) as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });
});

describe('ApiClient — logout', () => {
  it('attaches the Authorization header when getSessionJwt returns a value', async () => {
    let captured: RequestInit | undefined;
    const fetchImpl = makeFetch((_input, init) => {
      captured = init;
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    });
    const client = new ApiClient({
      baseUrl: BASE,
      fetchImpl,
      getSessionJwt: () => 'session-jwt-value',
    });
    await client.logout();
    expect((captured?.headers as Record<string, string>).Authorization).toBe(
      'Bearer session-jwt-value',
    );
  });

  it('omits the Authorization header when no token is configured', async () => {
    let captured: RequestInit | undefined;
    const fetchImpl = makeFetch((_input, init) => {
      captured = init;
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    });
    const client = new ApiClient({ baseUrl: BASE, fetchImpl });
    await client.logout();
    expect((captured?.headers as Record<string, string>).Authorization).toBeUndefined();
  });
});

describe('ApiClient — error mapping', () => {
  it('throws ApiError with parsed body for 4xx JSON responses', async () => {
    const fetchImpl = makeFetch(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: 'rate-limited', retryAfterMs: 30_000 }), {
          status: 429,
        }),
      ),
    );
    const client = new ApiClient({ baseUrl: BASE, fetchImpl });
    let thrown: unknown;
    try {
      await client.refresh({ sessionJwt: 'x' });
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(ApiError);
    if (thrown instanceof ApiError) {
      expect(thrown.status).toBe(429);
      expect(thrown.body).toEqual({ error: 'rate-limited', retryAfterMs: 30_000 });
    }
  });

  it('throws ApiError with body=null for non-JSON responses', async () => {
    const fetchImpl = makeFetch(() =>
      Promise.resolve(new Response('Internal Server Error', { status: 500 })),
    );
    const client = new ApiClient({ baseUrl: BASE, fetchImpl });
    let thrown: unknown;
    try {
      await client.logout();
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(ApiError);
    if (thrown instanceof ApiError) {
      expect(thrown.status).toBe(500);
      expect(thrown.body).toBeNull();
    }
  });

  it('throws ApiNetworkError when fetch rejects', async () => {
    const fetchImpl = makeFetch(() => Promise.reject(new TypeError('network')));
    const client = new ApiClient({ baseUrl: BASE, fetchImpl });
    let thrown: unknown;
    try {
      await client.logout();
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(ApiNetworkError);
  });

  it('throws ZodError when the server response does not match the schema', async () => {
    const fetchImpl = makeFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ unexpected: 'shape' }), { status: 200 })),
    );
    const client = new ApiClient({ baseUrl: BASE, fetchImpl });
    await expect(client.logout()).rejects.toThrow();
  });
});

describe('ApiClient — base URL handling', () => {
  it('strips a trailing slash on the baseUrl', async () => {
    let capturedUrl: string | undefined;
    const fetchImpl = makeFetch((input) => {
      capturedUrl = input;
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    });
    const client = new ApiClient({ baseUrl: `${BASE}/`, fetchImpl });
    await client.logout();
    expect(capturedUrl).toBe(`${BASE}/auth/logout`);
  });
});
