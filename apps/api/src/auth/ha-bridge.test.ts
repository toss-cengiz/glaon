import { describe, expect, it, vi } from 'vitest';

import { deriveUserId, introspectHaToken } from './ha-bridge';

function makeFetch(
  responder: (input: string, init?: RequestInit) => Response | Promise<Response>,
): typeof fetch {
  const impl = vi.fn(async (input: string, init?: RequestInit) => responder(input, init));
  return impl as unknown as typeof fetch;
}

const TOKEN = 'dummy';

describe('introspectHaToken', () => {
  it('returns ok + userId on 200', async () => {
    const fetchImpl = makeFetch(() =>
      Promise.resolve(new Response('{"message":"API running."}', { status: 200 })),
    );
    const result = await introspectHaToken('http://homeassistant.local:8123', TOKEN, {
      fetchImpl,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.userId).toBeTruthy();
  });

  it('rejects malformed haBaseUrl', async () => {
    const result = await introspectHaToken('not-a-url', TOKEN, {
      fetchImpl: makeFetch(() => new Response()),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid-url');
  });

  it('rejects file:// scheme', async () => {
    const result = await introspectHaToken('file:///etc/passwd', TOKEN, {
      fetchImpl: makeFetch(() => new Response()),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid-url');
  });

  it('maps 401 to unauthorized', async () => {
    const fetchImpl = makeFetch(() =>
      Promise.resolve(new Response('Unauthorized', { status: 401 })),
    );
    const result = await introspectHaToken('http://h:8123', TOKEN, { fetchImpl });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unauthorized');
  });

  it('maps fetch throw to unreachable', async () => {
    const fetchImpl = makeFetch(() => Promise.reject(new TypeError('network')));
    const result = await introspectHaToken('http://h:8123', TOKEN, { fetchImpl });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unreachable');
  });

  it('maps unexpected status to unexpected', async () => {
    const fetchImpl = makeFetch(() => Promise.resolve(new Response('boom', { status: 500 })));
    const result = await introspectHaToken('http://h:8123', TOKEN, { fetchImpl });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('unexpected');
      expect(result.status).toBe(500);
    }
  });

  it('passes the bearer token in the Authorization header', async () => {
    let captured: RequestInit | undefined;
    const fetchImpl = makeFetch((_input, init) => {
      captured = init;
      return Promise.resolve(new Response('{}', { status: 200 }));
    });
    await introspectHaToken('http://h:8123', 'sekrit', { fetchImpl });
    expect(captured?.headers).toMatchObject({ Authorization: 'Bearer sekrit' });
  });
});

describe('deriveUserId', () => {
  it('extracts the JWT sub claim when the token is a JWT', () => {
    const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = base64Url(JSON.stringify({ sub: 'hass-user-42' }));
    const jwt = `${header}.${payload}.sig`;
    expect(deriveUserId(jwt)).toBe('hass-user-42');
  });

  it('falls back to a deterministic hash for opaque LLAT-style tokens', () => {
    const opaque = 'long-lived-access-token-xyz';
    const id = deriveUserId(opaque);
    expect(id).toMatch(/^ha-llat:[0-9a-f]{8}$/);
    expect(deriveUserId(opaque)).toBe(id);
    expect(deriveUserId('different-token')).not.toBe(id);
  });
});

function base64Url(value: string): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
