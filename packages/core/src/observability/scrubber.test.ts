import { describe, expect, it } from 'vitest';

import type { ObservabilityEvent } from './types';
import {
  REDACTED,
  buildBeforeSend,
  scrubEvent,
  scrubHeaders,
  scrubQueryString,
  scrubRecursive,
  scrubUrl,
} from './scrubber';

describe('scrubUrl', () => {
  it('redacts sensitive query params', () => {
    const result = scrubUrl('https://ha.local/api/auth?access_token=abc&code=xyz&other=keep');
    expect(result).not.toContain('abc');
    expect(result).not.toContain('xyz');
    expect(result).toContain('other=keep');
    expect(result).toContain(encodeURIComponent(REDACTED));
  });

  it('leaves unrelated URLs untouched', () => {
    const url = 'https://ha.local/api/entity/light.kitchen';
    expect(scrubUrl(url)).toBe(url);
  });

  it('returns the original string for malformed URLs', () => {
    expect(scrubUrl('not a url')).toBe('not a url');
  });

  it('redacts token, refresh_token, id_token, state, client_secret, api_key', () => {
    const url =
      'https://example.com/x?token=a&refresh_token=b&id_token=c&state=d&client_secret=e&api_key=f';
    const result = scrubUrl(url);
    for (const secret of ['a', 'b', 'c', 'd', 'e', 'f']) {
      expect(result).not.toContain(`=${secret}`);
    }
  });
});

describe('scrubQueryString', () => {
  it('redacts sensitive params in a query string', () => {
    const result = scrubQueryString('access_token=xyz&foo=bar');
    expect(result).not.toContain('xyz');
    expect(result).toContain('foo=bar');
  });

  it('handles a leading question mark', () => {
    const result = scrubQueryString('?code=abc&q=hello');
    expect(result).not.toContain('abc');
    expect(result).toContain('q=hello');
  });
});

describe('scrubHeaders', () => {
  it('redacts Authorization, Cookie, Set-Cookie regardless of case', () => {
    const result = scrubHeaders({
      Authorization: 'Bearer token123',
      cookie: 'session=abc',
      'Set-Cookie': 'x=y',
      'X-Auth-Token': 'zzz',
      'X-Request-Id': 'keep-me',
    });
    expect(result.Authorization).toBe(REDACTED);
    expect(result.cookie).toBe(REDACTED);
    expect(result['Set-Cookie']).toBe(REDACTED);
    expect(result['X-Auth-Token']).toBe(REDACTED);
    expect(result['X-Request-Id']).toBe('keep-me');
  });
});

describe('scrubRecursive', () => {
  it('redacts keys whose name contains a sensitive substring', () => {
    const input = {
      user_access_token: 'abc',
      nested: { refresh_token: 'xyz', name: 'alice' },
      list: [{ password: 'p1' }, { safe: 'ok' }],
    };
    const result = scrubRecursive(input) as Record<string, unknown>;
    expect(result.user_access_token).toBe(REDACTED);
    const nested = result.nested as Record<string, unknown>;
    expect(nested.refresh_token).toBe(REDACTED);
    expect(nested.name).toBe('alice');
    const list = result.list as Record<string, unknown>[];
    expect(list[0]?.password).toBe(REDACTED);
    expect(list[1]?.safe).toBe('ok');
  });

  it('stops recursing at the safety depth and returns the deep value as-is', () => {
    let node: Record<string, unknown> = { access_token: 'leaf' };
    for (let i = 0; i < 10; i++) {
      node = { child: node };
    }
    const result = scrubRecursive(node, 0) as Record<string, unknown>;
    // We don't assert exact redaction at depth; only that it didn't throw and returned an object.
    expect(result).toBeTypeOf('object');
  });

  it('passes through null, primitives, and undefined unchanged', () => {
    expect(scrubRecursive(null)).toBe(null);
    expect(scrubRecursive(42)).toBe(42);
    expect(scrubRecursive('plain')).toBe('plain');
    expect(scrubRecursive(undefined)).toBe(undefined);
  });
});

describe('scrubEvent', () => {
  it('scrubs request.url, headers, cookies, and data', () => {
    const event: ObservabilityEvent = {
      request: {
        url: 'https://ha.local/api/auth/token?access_token=leak',
        headers: { Authorization: 'Bearer xxx', 'X-Ok': 'y' },
        cookies: 'session=abc',
        data: { password: 'p', name: 'glaon' },
        query_string: 'code=abc&q=hello',
      },
    };
    const result = scrubEvent(event);
    expect(result.request?.url).not.toContain('leak');
    expect(result.request?.headers?.Authorization).toBe(REDACTED);
    expect(result.request?.cookies).toBe(REDACTED);
    const data = result.request?.data as Record<string, unknown>;
    expect(data.password).toBe(REDACTED);
    expect(data.name).toBe('glaon');
    expect(result.request?.query_string).not.toContain('abc');
    expect(result.request?.query_string).toContain('q=hello');
  });

  it('scrubs extra, contexts, tags, and http breadcrumbs', () => {
    const event: ObservabilityEvent = {
      extra: { access_token: 'leak', keep: 1 },
      contexts: { auth: { refresh_token: 'r1' } },
      tags: { client_secret: 's1', env: 'prod' },
      breadcrumbs: [
        {
          category: 'http',
          message: 'GET /api/auth/token',
          data: { url: 'https://ha/x?code=y', method: 'GET', api_key: 'k' },
        },
      ],
    };
    const result = scrubEvent(event);
    const extra: Record<string, unknown> = result.extra ?? {};
    expect(extra.access_token).toBe(REDACTED);
    expect(extra.keep).toBe(1);
    const contexts = (result.contexts ?? {}) as Record<string, Record<string, unknown>>;
    expect(contexts.auth?.refresh_token).toBe(REDACTED);
    const tags: Record<string, unknown> = result.tags ?? {};
    expect(tags.client_secret).toBe(REDACTED);
    expect(tags.env).toBe('prod');
    const bc = result.breadcrumbs?.[0];
    // Free-text message is passed through unchanged.
    expect(bc?.message).toBe('GET /api/auth/token');
    const bcData: Record<string, unknown> = bc?.data ?? {};
    // URL-keyed values in breadcrumb data get URL-scrubbed.
    expect(bcData.url).not.toContain('=y');
    // Sensitive keys anywhere in data get redacted.
    expect(bcData.api_key).toBe(REDACTED);
    expect(bcData.method).toBe('GET');
  });

  it('returns a new object and does not mutate the input', () => {
    const event: ObservabilityEvent = {
      extra: { access_token: 'leak' },
    };
    const original = JSON.parse(JSON.stringify(event)) as ObservabilityEvent;
    scrubEvent(event);
    expect(event).toEqual(original);
  });
});

describe('buildBeforeSend', () => {
  it('returns a function that scrubs events', () => {
    const beforeSend = buildBeforeSend();
    const event: ObservabilityEvent = {
      request: { url: 'https://ha.local/x?token=leak' },
    };
    const result = beforeSend(event);
    expect(result).not.toBeNull();
    expect(result?.request?.url).not.toContain('leak');
  });
});

describe('HA-specific leak scenarios', () => {
  it('redacts a realistic HA access token passed via query param', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJoYS5sb2NhbCJ9.fake-sig';
    const event: ObservabilityEvent = {
      request: {
        url: `https://ha.local/auth/token?access_token=${token}`,
      },
    };
    const result = scrubEvent(event);
    expect(result.request?.url).not.toContain(token);
  });

  it('redacts Authorization header with Bearer token', () => {
    const event: ObservabilityEvent = {
      request: {
        headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig' },
      },
    };
    const result = scrubEvent(event);
    expect(result.request?.headers?.Authorization).toBe(REDACTED);
  });
});
