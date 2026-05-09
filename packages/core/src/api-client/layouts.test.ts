import { describe, expect, it, vi } from 'vitest';

import { ApiClient } from './client';
import type { Layout } from './layouts';

function makeFetch(
  responder: (input: string, init?: RequestInit) => Response | Promise<Response>,
): typeof fetch {
  const impl = vi.fn(async (input: string, init?: RequestInit) => responder(input, init));
  return impl as unknown as typeof fetch;
}

const SAMPLE_LAYOUT: Layout = {
  id: 'layout-1',
  userId: 'user-1',
  homeId: 'home-1',
  name: 'Living room',
  payload: { rows: 2 },
  createdAt: '2026-05-09T00:00:00.000Z',
  updatedAt: '2026-05-09T00:00:00.000Z',
};

const BASE = 'https://api.glaon.test';

describe('ApiClient — listLayouts', () => {
  it('hits GET /layouts when no homeId is provided', async () => {
    let captured: { url: string; init: RequestInit | undefined } | undefined;
    const fetchImpl = makeFetch((url, init) => {
      captured = { url, init };
      return Promise.resolve(
        new Response(JSON.stringify({ layouts: [SAMPLE_LAYOUT] }), { status: 200 }),
      );
    });
    const client = new ApiClient({ baseUrl: BASE, fetchImpl });
    const result = await client.listLayouts();
    expect(captured?.url).toBe(`${BASE}/layouts`);
    expect(captured?.init?.method).toBe('GET');
    expect(result.layouts).toHaveLength(1);
  });

  it('encodes the homeId into the query string', async () => {
    let capturedUrl: string | undefined;
    const fetchImpl = makeFetch((url) => {
      capturedUrl = url;
      return Promise.resolve(new Response(JSON.stringify({ layouts: [] }), { status: 200 }));
    });
    const client = new ApiClient({ baseUrl: BASE, fetchImpl });
    await client.listLayouts({ homeId: 'home a/b' });
    expect(capturedUrl).toBe(`${BASE}/layouts?homeId=home%20a%2Fb`);
  });
});

describe('ApiClient — createLayout', () => {
  it('POSTs the body and parses the response', async () => {
    let captured: RequestInit | undefined;
    const fetchImpl = makeFetch((_url, init) => {
      captured = init;
      return Promise.resolve(new Response(JSON.stringify(SAMPLE_LAYOUT), { status: 201 }));
    });
    const client = new ApiClient({ baseUrl: BASE, fetchImpl });
    const result = await client.createLayout({
      homeId: 'home-1',
      name: 'Living room',
      payload: { rows: 2 },
    });
    expect(captured?.method).toBe('POST');
    expect(JSON.parse(captured?.body as string)).toEqual({
      homeId: 'home-1',
      name: 'Living room',
      payload: { rows: 2 },
    });
    expect(result.id).toBe('layout-1');
  });

  it('rejects bad request bodies before sending', async () => {
    const fetchImpl = makeFetch(() => new Response());
    const client = new ApiClient({ baseUrl: BASE, fetchImpl });
    await expect(client.createLayout({ homeId: '', name: '', payload: {} })).rejects.toThrow();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('ApiClient — getLayout / updateLayout / deleteLayout', () => {
  it('encodes the id into the path on GET', async () => {
    let capturedUrl: string | undefined;
    const fetchImpl = makeFetch((url) => {
      capturedUrl = url;
      return Promise.resolve(new Response(JSON.stringify(SAMPLE_LAYOUT), { status: 200 }));
    });
    const client = new ApiClient({ baseUrl: BASE, fetchImpl });
    await client.getLayout('layout/1');
    expect(capturedUrl).toBe(`${BASE}/layouts/layout%2F1`);
  });

  it('PUTs partial updates', async () => {
    let captured: { url: string; init: RequestInit | undefined } | undefined;
    const fetchImpl = makeFetch((url, init) => {
      captured = { url, init };
      return Promise.resolve(new Response(JSON.stringify(SAMPLE_LAYOUT), { status: 200 }));
    });
    const client = new ApiClient({ baseUrl: BASE, fetchImpl });
    await client.updateLayout('layout-1', { name: 'New' });
    expect(captured?.init?.method).toBe('PUT');
    expect(JSON.parse(captured?.init?.body as string)).toEqual({ name: 'New' });
  });

  it('issues DELETE and resolves on 204', async () => {
    let captured: RequestInit | undefined;
    const fetchImpl = makeFetch((_url, init) => {
      captured = init;
      return Promise.resolve(new Response(null, { status: 204 }));
    });
    const client = new ApiClient({ baseUrl: BASE, fetchImpl });
    await expect(client.deleteLayout('layout-1')).resolves.toBeUndefined();
    expect(captured?.method).toBe('DELETE');
  });

  it('throws ApiError on 404 from delete', async () => {
    const fetchImpl = makeFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ error: 'not-found' }), { status: 404 })),
    );
    const client = new ApiClient({ baseUrl: BASE, fetchImpl });
    await expect(client.deleteLayout('missing')).rejects.toThrow(/404/);
  });
});
