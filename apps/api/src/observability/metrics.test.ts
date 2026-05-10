import { describe, expect, it, vi } from 'vitest';

import { Metrics } from './metrics';

describe('Metrics', () => {
  it('renders the prom text format with the static + dynamic counters', () => {
    const metrics = new Metrics();
    metrics.observeRequest({ method: 'GET', route: '/healthz', status: 200 });
    metrics.observeRequest({ method: 'GET', route: '/healthz', status: 200 });
    metrics.observeRequest({ method: 'POST', route: '/layouts', status: 201 });
    metrics.setMongoPing(7);
    const output = metrics.render();
    expect(output).toContain('# HELP process_uptime_seconds');
    expect(output).toContain('# TYPE process_uptime_seconds gauge');
    expect(output).toContain('http_requests_total{method="GET",route="/healthz",status="200"} 2');
    expect(output).toContain('http_requests_total{method="POST",route="/layouts",status="201"} 1');
    expect(output).toContain('mongo_ping_milliseconds 7');
  });

  it('emits NaN for the mongo ping gauge when no observation has been made', () => {
    const metrics = new Metrics();
    expect(metrics.render()).toContain('mongo_ping_milliseconds NaN');
  });

  it('reports a non-negative process uptime', () => {
    vi.useFakeTimers();
    const metrics = new Metrics();
    vi.advanceTimersByTime(2_500);
    const output = metrics.render();
    vi.useRealTimers();
    expect(output).toMatch(/process_uptime_seconds [0-9]+/);
  });

  it('escapes label values with quotes / backslashes / newlines', () => {
    const metrics = new Metrics();
    metrics.observeRequest({ method: 'GET', route: '/weird"path\\', status: 200 });
    const output = metrics.render();
    expect(output).toContain('route="/weird\\"path\\\\"');
  });
});
