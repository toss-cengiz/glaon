import { describe, expect, it, vi } from 'vitest';

import { ApiClient } from './client';

function makeFetch(
  responder: (input: string, init?: RequestInit) => Response | Promise<Response>,
): typeof fetch {
  const impl = vi.fn(async (input: string, init?: RequestInit) => responder(input, init));
  return impl as unknown as typeof fetch;
}

const BASE = 'https://api.glaon.test';

describe('ApiClient — getMyPreferences', () => {
  it('GETs /me/preferences and parses the response', async () => {
    let captured: { url: string; init: RequestInit | undefined } | undefined;
    const fetchImpl = makeFetch((url, init) => {
      captured = { url, init };
      return Promise.resolve(
        new Response(JSON.stringify({ locale: 'tr' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
    const client = new ApiClient({
      baseUrl: BASE,
      fetchImpl,
      getSessionJwt: () => 'session-jwt',
    });
    const result = await client.getMyPreferences();
    expect(result).toEqual({ locale: 'tr' });
    expect(captured?.url).toBe(`${BASE}/me/preferences`);
    expect(captured?.init?.method).toBe('GET');
    expect((captured?.init?.headers as Record<string, string>).Authorization).toBe(
      'Bearer session-jwt',
    );
  });
});

describe('ApiClient — updateMyPreferences', () => {
  it('PATCHes /me/preferences with the parsed body', async () => {
    let captured: { url: string; init: RequestInit | undefined } | undefined;
    const fetchImpl = makeFetch((url, init) => {
      captured = { url, init };
      return Promise.resolve(
        new Response(JSON.stringify({ locale: 'tr' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
    const client = new ApiClient({ baseUrl: BASE, fetchImpl });
    const result = await client.updateMyPreferences({ locale: 'tr' });
    expect(result).toEqual({ locale: 'tr' });
    expect(captured?.url).toBe(`${BASE}/me/preferences`);
    expect(captured?.init?.method).toBe('PATCH');
    expect(captured?.init?.body).toBe('{"locale":"tr"}');
  });

  it('rejects unsupported locales locally before sending', async () => {
    const fetchImpl = makeFetch(() => new Response());
    const client = new ApiClient({ baseUrl: BASE, fetchImpl });
    await expect(client.updateMyPreferences({ locale: 'fr' as unknown as 'tr' })).rejects.toThrow();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects extra fields locally before sending (strict)', async () => {
    const fetchImpl = makeFetch(() => new Response());
    const client = new ApiClient({ baseUrl: BASE, fetchImpl });
    await expect(
      client.updateMyPreferences({ locale: 'tr', extra: 1 } as unknown as { locale: 'tr' }),
    ).rejects.toThrow();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
