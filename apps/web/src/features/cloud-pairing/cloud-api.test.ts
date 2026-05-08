import { describe, expect, it, vi } from 'vitest';

import { createCloudPairClient } from './cloud-api';

function makeFetch(
  responder: (input: string, init?: RequestInit) => Response | Promise<Response>,
): typeof fetch {
  const impl = vi.fn(async (input: string, init?: RequestInit) => responder(input, init));
  return impl as unknown as typeof fetch;
}

const TOKEN = 'clerk_session_jwt';

describe('cloud-api initiate', () => {
  it('returns the parsed code + expiresAt on 201', async () => {
    const fetchImpl = makeFetch(async () =>
      Promise.resolve(
        new Response(JSON.stringify({ code: '123456', expiresAt: 1234 }), { status: 201 }),
      ),
    );
    const client = createCloudPairClient({ fetchImpl, cloudBase: 'https://relay.glaon.app' });
    const result = await client.initiate(TOKEN);
    expect(result).toEqual({ ok: true, data: { code: '123456', expiresAt: 1234 } });
  });

  it('maps 401 to unauthorized', async () => {
    const fetchImpl = makeFetch(async () =>
      Promise.resolve(new Response('{"error":"unauthorized"}', { status: 401 })),
    );
    const client = createCloudPairClient({ fetchImpl, cloudBase: 'https://relay.glaon.app' });
    expect(await client.initiate(TOKEN)).toEqual({ ok: false, err: { kind: 'unauthorized' } });
  });

  it('maps 429 with retryAfterMs', async () => {
    const fetchImpl = makeFetch(async () =>
      Promise.resolve(
        new Response(JSON.stringify({ error: 'rate-limited', retryAfterMs: 90_000 }), {
          status: 429,
        }),
      ),
    );
    const client = createCloudPairClient({ fetchImpl, cloudBase: 'https://relay.glaon.app' });
    expect(await client.initiate(TOKEN)).toEqual({
      ok: false,
      err: { kind: 'rate-limited', retryAfterMs: 90_000 },
    });
  });

  it('maps fetch errors to network kind', async () => {
    const fetchImpl = makeFetch(async () => Promise.reject(new TypeError('disconnect')));
    const client = createCloudPairClient({ fetchImpl, cloudBase: 'https://relay.glaon.app' });
    expect(await client.initiate(TOKEN)).toEqual({ ok: false, err: { kind: 'network' } });
  });

  it('passes the Bearer token in the Authorization header', async () => {
    let captured: RequestInit | undefined;
    const fetchImpl = makeFetch(async (_input, init) => {
      captured = init;
      return Promise.resolve(
        new Response(JSON.stringify({ code: 'A', expiresAt: 1 }), { status: 201 }),
      );
    });
    const client = createCloudPairClient({ fetchImpl, cloudBase: 'https://relay.glaon.app' });
    await client.initiate(TOKEN);
    expect(captured?.headers).toMatchObject({ Authorization: `Bearer ${TOKEN}` });
  });
});

describe('cloud-api status', () => {
  it('returns the status payload on 200', async () => {
    const fetchImpl = makeFetch(async () =>
      Promise.resolve(
        new Response(JSON.stringify({ status: 'claimed', homeId: 'home-X' }), { status: 200 }),
      ),
    );
    const client = createCloudPairClient({ fetchImpl, cloudBase: 'https://relay.glaon.app' });
    const result = await client.status(TOKEN, 'CODE-1');
    expect(result).toEqual({ ok: true, data: { status: 'claimed', homeId: 'home-X' } });
  });

  it('encodes the code into the query string', async () => {
    let capturedUrl: string | undefined;
    const fetchImpl = makeFetch(async (input) => {
      capturedUrl = input;
      return Promise.resolve(new Response(JSON.stringify({ status: 'pending' }), { status: 200 }));
    });
    const client = createCloudPairClient({ fetchImpl, cloudBase: 'https://relay.glaon.app' });
    await client.status(TOKEN, 'has space');
    expect(capturedUrl).toBe('https://relay.glaon.app/pair/status?code=has%20space');
  });
});
