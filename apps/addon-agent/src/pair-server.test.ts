import { EventEmitter } from 'node:events';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';

import { describe, expect, it, vi } from 'vitest';

import { createPairHandler } from './pair-server';
import { AgentState } from './state';
import type { AddonOptions, OptionsStore } from './options-store';

interface MockResponse {
  statusCode: number;
  headers: Record<string, string | number>;
  body: string;
}

function makeReq(method: string, url: string, body?: string): IncomingMessage {
  const stream = body !== undefined ? Readable.from([body]) : Readable.from([]);
  Object.assign(stream, { method, url });
  return stream as unknown as IncomingMessage;
}

function makeRes(): { res: ServerResponse; out: MockResponse; done: Promise<void> } {
  const out: MockResponse = { statusCode: 0, headers: {}, body: '' };
  let resolveDone!: () => void;
  const done = new Promise<void>((r) => {
    resolveDone = r;
  });
  const res = new EventEmitter() as unknown as ServerResponse;
  Object.assign(res, {
    writeHead(status: number, headers: Record<string, string | number>) {
      out.statusCode = status;
      out.headers = headers;
    },
    end(chunk?: string) {
      if (chunk !== undefined) out.body += chunk;
      resolveDone();
    },
  });
  return { res, out, done };
}

function makeStore(initial: AddonOptions = {}): OptionsStore & {
  read: () => AddonOptions;
  write: (o: AddonOptions) => void;
  written: AddonOptions[];
} {
  let current: AddonOptions = initial;
  const written: AddonOptions[] = [];
  return {
    read: () => current,
    write: (o: AddonOptions) => {
      current = o;
      written.push(o);
    },
    written,
  };
}

const ASSETS = { html: '<html>pair</html>', css: '.x{}', js: 'console.log(1)' };

function makeDeps(
  overrides: {
    store?: ReturnType<typeof makeStore>;
    state?: AgentState;
    cloudFetch?: Parameters<typeof createPairHandler>[0]['cloudFetch'];
    logger?: Parameters<typeof createPairHandler>[0]['logger'];
  } = {},
) {
  return {
    options: overrides.store ?? makeStore(),
    state: overrides.state ?? new AgentState(),
    staticAssets: ASSETS,
    logger: overrides.logger ?? vi.fn(),
    cloudFetch: overrides.cloudFetch,
  };
}

describe('pair handler — static assets', () => {
  it('serves the pair HTML on GET /pair', async () => {
    const deps = makeDeps();
    const handler = createPairHandler(deps);
    const { res, out, done } = makeRes();
    handler(makeReq('GET', '/pair'), res);
    await done;
    expect(out.statusCode).toBe(200);
    expect(out.headers['Content-Type']).toBe('text/html; charset=utf-8');
    expect(out.body).toContain('pair');
  });

  it('serves CSS and JS', async () => {
    const handler = createPairHandler(makeDeps());
    {
      const { res, out, done } = makeRes();
      handler(makeReq('GET', '/pair/pair.css'), res);
      await done;
      expect(out.body).toBe('.x{}');
      expect(out.headers['Content-Type']).toBe('text/css; charset=utf-8');
    }
    {
      const { res, out, done } = makeRes();
      handler(makeReq('GET', '/pair/pair.js'), res);
      await done;
      expect(out.body).toBe('console.log(1)');
      expect(out.headers['Content-Type']).toBe('application/javascript; charset=utf-8');
    }
  });
});

describe('pair handler — status', () => {
  it('reports paired:false when options are empty', async () => {
    const handler = createPairHandler(makeDeps());
    const { res, out, done } = makeRes();
    handler(makeReq('GET', '/pair/status'), res);
    await done;
    expect(JSON.parse(out.body)).toEqual({ paired: false });
  });

  it('reports paired:true and discloses non-secret fields', async () => {
    const store = makeStore({
      cloud_url: 'https://relay.glaon.app',
      home_id: 'home-9',
      relay_secret: 'sekrit-DO-NOT-LEAK',
    });
    const handler = createPairHandler(makeDeps({ store }));
    const { res, out, done } = makeRes();
    handler(makeReq('GET', '/pair/status'), res);
    await done;
    const parsed = JSON.parse(out.body) as Record<string, unknown>;
    expect(parsed.paired).toBe(true);
    expect(parsed.homeId).toBe('home-9');
    expect(parsed.cloudUrl).toBe('https://relay.glaon.app');
    expect(out.body).not.toContain('sekrit-DO-NOT-LEAK');
  });
});

describe('pair handler — claim', () => {
  it('rejects empty body with 400', async () => {
    const handler = createPairHandler(makeDeps());
    const { res, out, done } = makeRes();
    handler(makeReq('POST', '/pair/claim'), res);
    await done;
    expect(out.statusCode).toBe(400);
  });

  it('rejects malformed JSON with 400', async () => {
    const handler = createPairHandler(makeDeps());
    const { res, out, done } = makeRes();
    handler(makeReq('POST', '/pair/claim', 'not json'), res);
    await done;
    expect(out.statusCode).toBe(400);
  });

  it('rejects missing code field with 400', async () => {
    const handler = createPairHandler(makeDeps());
    const { res, out, done } = makeRes();
    handler(makeReq('POST', '/pair/claim', '{}'), res);
    await done;
    expect(out.statusCode).toBe(400);
    expect(JSON.parse(out.body)).toEqual({ error: 'code-required' });
  });

  it('persists credentials and signals state on a successful claim', async () => {
    const store = makeStore();
    const state = new AgentState();
    const wake = state.waitForWake();
    const cloudFetch = vi.fn(() =>
      Promise.resolve({
        ok: true as const,
        data: {
          homeId: 'home-new',
          relaySecret: 'fresh-relay-secret',
          cloudUrl: 'https://relay.glaon.app',
        },
      }),
    );
    const handler = createPairHandler(makeDeps({ store, state, cloudFetch }));
    const { res, out, done } = makeRes();
    handler(makeReq('POST', '/pair/claim', '{"code":"ABC123"}'), res);
    await done;

    expect(out.statusCode).toBe(200);
    const body = JSON.parse(out.body) as Record<string, unknown>;
    expect(body).toEqual({
      paired: true,
      homeId: 'home-new',
      cloudUrl: 'https://relay.glaon.app',
    });
    expect(store.written).toEqual([
      {
        cloud_url: 'https://relay.glaon.app',
        home_id: 'home-new',
        relay_secret: 'fresh-relay-secret',
      },
    ]);
    await wake;
    expect(cloudFetch).toHaveBeenCalledWith('https://relay.glaon.app', 'ABC123');
  });

  it('forwards cloud rejection codes (410 expired) with scrubbed body', async () => {
    const cloudFetch = vi.fn(() =>
      Promise.resolve({
        ok: false as const,
        err: { status: 410, body: { error: 'expired', code: 'code-expired' } },
      }),
    );
    const handler = createPairHandler(makeDeps({ cloudFetch }));
    const { res, out, done } = makeRes();
    handler(makeReq('POST', '/pair/claim', '{"code":"WRONG1"}'), res);
    await done;
    expect(out.statusCode).toBe(410);
    expect(JSON.parse(out.body)).toEqual({ error: 'expired', code: 'code-expired' });
  });

  it('forwards rate-limit (429) with retryAfterMs', async () => {
    const cloudFetch = vi.fn(() =>
      Promise.resolve({
        ok: false as const,
        err: {
          status: 429,
          body: { error: 'rate-limited', code: 'claim-locked', retryAfterMs: 60_000 },
        },
      }),
    );
    const handler = createPairHandler(makeDeps({ cloudFetch }));
    const { res, out, done } = makeRes();
    handler(makeReq('POST', '/pair/claim', '{"code":"BLOCKED"}'), res);
    await done;
    expect(out.statusCode).toBe(429);
    expect(JSON.parse(out.body)).toMatchObject({
      error: 'rate-limited',
      retryAfterMs: 60_000,
    });
  });

  it('uses the operator-configured cloud_url when host is on the allowlist', async () => {
    const store = makeStore({
      cloud_url: 'https://relay-staging.glaon.app',
    });
    const cloudFetch = vi.fn(() =>
      Promise.resolve({
        ok: true as const,
        data: {
          homeId: 'h',
          relaySecret: 's',
          cloudUrl: 'https://relay-staging.glaon.app',
        },
      }),
    );
    const handler = createPairHandler(makeDeps({ store, cloudFetch }));
    const { res, done } = makeRes();
    handler(makeReq('POST', '/pair/claim', '{"code":"OK"}'), res);
    await done;
    expect(cloudFetch).toHaveBeenCalledWith('https://relay-staging.glaon.app', 'OK');
  });

  it('falls back to prod when stored cloud_url host is not on the allowlist', async () => {
    const store = makeStore({ cloud_url: 'https://evil.example.com' });
    const cloudFetch = vi.fn(() =>
      Promise.resolve({
        ok: true as const,
        data: { homeId: 'h', relaySecret: 's', cloudUrl: 'https://relay.glaon.app' },
      }),
    );
    const handler = createPairHandler(makeDeps({ store, cloudFetch }));
    const { res, done } = makeRes();
    handler(makeReq('POST', '/pair/claim', '{"code":"OK"}'), res);
    await done;
    expect(cloudFetch).toHaveBeenCalledWith('https://relay.glaon.app', 'OK');
  });
});

describe('pair handler — fallthrough', () => {
  it('returns 404 for unknown paths', async () => {
    const handler = createPairHandler(makeDeps());
    const { res, out, done } = makeRes();
    handler(makeReq('GET', '/unknown'), res);
    await done;
    expect(out.statusCode).toBe(404);
  });
});
