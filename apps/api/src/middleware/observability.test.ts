import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import { createLogger } from '../observability/logger';
import { Metrics } from '../observability/metrics';
import { observabilityMiddleware } from './observability';

function makeApp() {
  const lines: string[] = [];
  const logger = createLogger({
    level: 'debug',
    write: (line) => lines.push(line),
  });
  const metrics = new Metrics();
  const newRequestId = vi.fn(() => 'fixed-id');
  const app = new Hono();
  app.use('*', observabilityMiddleware({ logger, metrics, newRequestId }));
  app.get('/probe', (c) => c.json({ ok: true }));
  app.get('/layouts/:id', (c) => c.json({ id: c.req.param('id') }));
  app.get('/boom', () => {
    throw new Error('boom');
  });
  return { app, lines, metrics, newRequestId };
}

describe('observabilityMiddleware', () => {
  it('echoes X-Request-Id and emits a request log line', async () => {
    const { app, lines } = makeApp();
    const res = await app.request('/probe');
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Request-Id')).toBe('fixed-id');
    expect(lines).toHaveLength(1);
    const firstLine = lines[0];
    if (firstLine === undefined) throw new Error('expected one log line');
    const parsed = JSON.parse(firstLine) as Record<string, unknown>;
    expect(parsed.msg).toBe('request');
    expect(parsed.method).toBe('GET');
    expect(parsed.path).toBe('/probe');
    expect(parsed.status).toBe(200);
    expect(parsed.request_id).toBe('fixed-id');
    expect(typeof parsed.duration_ms).toBe('number');
  });

  it('honours an inbound X-Request-Id when it matches the safe charset', async () => {
    const { app } = makeApp();
    const res = await app.request('/probe', {
      headers: { 'X-Request-Id': 'trace_abc-123' },
    });
    expect(res.headers.get('X-Request-Id')).toBe('trace_abc-123');
  });

  it('rejects an inbound X-Request-Id with unsafe characters', async () => {
    const { app, newRequestId } = makeApp();
    const res = await app.request('/probe', {
      headers: { 'X-Request-Id': '<script>alert(1)</script>' },
    });
    expect(res.headers.get('X-Request-Id')).toBe('fixed-id');
    expect(newRequestId).toHaveBeenCalled();
  });

  it('collapses param-laden routes to label form for metrics', async () => {
    const { app, metrics } = makeApp();
    await app.request('/layouts/abc-123');
    const output = metrics.render();
    expect(output).toContain('route="/layouts/:id"');
  });
});
