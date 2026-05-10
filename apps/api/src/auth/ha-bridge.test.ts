import { describe, expect, it, vi } from 'vitest';

import { deriveUserId, introspectHaToken, loginFlow } from './ha-bridge';

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

describe('loginFlow', () => {
  const credentials = {
    username: 'olivia',
    password: 'correct-horse',
    clientId: 'https://app.glaon.com/',
  };

  function scriptedFetch(steps: {
    init: Response;
    submit?: Response;
    token?: Response;
  }): typeof fetch {
    let call = 0;
    return makeFetch(() => {
      call += 1;
      if (call === 1) return steps.init;
      if (call === 2 && steps.submit !== undefined) return steps.submit;
      if (call === 3 && steps.token !== undefined) return steps.token;
      return new Response('unexpected call', { status: 500 });
    });
  }

  it('returns ok with tokens after a happy-path 3-step flow', async () => {
    const fetchImpl = scriptedFetch({
      init: new Response(JSON.stringify({ flow_id: 'F-1', type: 'form' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
      submit: new Response(JSON.stringify({ type: 'create_entry', result: 'AUTH-CODE' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
      token: new Response(
        JSON.stringify({
          access_token: 'A',
          refresh_token: 'R',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    });
    const result = await loginFlow('http://h:8123', credentials, { fetchImpl });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.accessToken).toBe('A');
      expect(result.refreshToken).toBe('R');
      expect(result.expiresIn).toBe(3600);
    }
  });

  it('returns invalid-url when the HA URL is not http/https', async () => {
    const result = await loginFlow('file:///etc/passwd', credentials, {
      fetchImpl: makeFetch(() => new Response()),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid-url');
  });

  it('returns invalid-credentials when HA aborts with invalid_auth', async () => {
    const fetchImpl = scriptedFetch({
      init: new Response(JSON.stringify({ flow_id: 'F-1', type: 'form' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
      submit: new Response(JSON.stringify({ type: 'abort', reason: 'invalid_auth' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    });
    const result = await loginFlow('http://h:8123', credentials, { fetchImpl });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid-credentials');
  });

  it('returns mfa-required when HA prompts a follow-up form step', async () => {
    const fetchImpl = scriptedFetch({
      init: new Response(JSON.stringify({ flow_id: 'F-1', type: 'form' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
      submit: new Response(JSON.stringify({ type: 'form', step_id: 'mfa', flow_id: 'F-1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    });
    const result = await loginFlow('http://h:8123', credentials, { fetchImpl });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('mfa-required');
  });

  it('returns unreachable when fetch throws', async () => {
    const fetchImpl = makeFetch(() => Promise.reject(new TypeError('network')));
    const result = await loginFlow('http://h:8123', credentials, { fetchImpl });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unreachable');
  });

  it('returns flow-error when the token endpoint omits expected fields', async () => {
    const fetchImpl = scriptedFetch({
      init: new Response(JSON.stringify({ flow_id: 'F-1', type: 'form' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
      submit: new Response(JSON.stringify({ type: 'create_entry', result: 'CODE' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
      token: new Response(JSON.stringify({ unrelated: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    });
    const result = await loginFlow('http://h:8123', credentials, { fetchImpl });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('flow-error');
  });

  it('posts /auth/token as form-urlencoded with the auth code', async () => {
    const tokenCall: {
      value: { url: string; body: string; headers: Record<string, string> } | null;
    } = { value: null };
    const fetchImpl = makeFetch((input, init) => {
      const url: string = input;
      const headers = (init?.headers ?? {}) as Record<string, string>;
      if (url.endsWith('/auth/login_flow')) {
        return new Response(JSON.stringify({ flow_id: 'F-1', type: 'form' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('/auth/login_flow/')) {
        return new Response(JSON.stringify({ type: 'create_entry', result: 'AUTH-X' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const rawBody = init?.body;
      const bodyText = typeof rawBody === 'string' ? rawBody : '';
      tokenCall.value = { url, body: bodyText, headers };
      return new Response(
        JSON.stringify({
          access_token: 'A',
          refresh_token: 'R',
          expires_in: 1,
          token_type: 'Bearer',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });
    await loginFlow('http://h:8123', credentials, { fetchImpl });
    expect(tokenCall.value).not.toBeNull();
    const captured = tokenCall.value;
    if (captured !== null) {
      expect(captured.url.endsWith('/auth/token')).toBe(true);
      expect(captured.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      expect(captured.body).toContain('grant_type=authorization_code');
      expect(captured.body).toContain('code=AUTH-X');
      expect(captured.body).toContain(`client_id=${encodeURIComponent(credentials.clientId)}`);
    }
  });
});
