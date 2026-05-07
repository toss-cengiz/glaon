import { describe, expect, it } from 'vitest';

import app, { type Bindings } from './index';

const env: Bindings = { LOG_LEVEL: 'error' };

describe('apps/cloud routes', () => {
  it('GET /healthz returns ok', async () => {
    const res = await app.request('/healthz', undefined, env);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: 'ok' });
  });

  it('GET /version returns build info', async () => {
    const res = await app.request('/version', undefined, env);
    expect(res.status).toBe(200);
    const body: Record<string, unknown> = await res.json();
    expect(body.commit).toBeTruthy();
    expect(body.buildTime).toBeTruthy();
    expect(body.environment).toBe('unknown');
  });

  it('GET /version surfaces the SENTRY_ENVIRONMENT binding', async () => {
    const stagingEnv: Bindings = { LOG_LEVEL: 'error', SENTRY_ENVIRONMENT: 'staging' };
    const res = await app.request('/version', undefined, stagingEnv);
    const body: Record<string, unknown> = await res.json();
    expect(body.environment).toBe('staging');
  });

  it('returns 404 for an unknown route', async () => {
    const res = await app.request('/missing', undefined, env);
    expect(res.status).toBe(404);
  });
});
