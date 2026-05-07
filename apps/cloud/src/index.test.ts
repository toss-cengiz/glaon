import { describe, expect, it } from 'vitest';

import { FakeD1 } from './db/fake';
import app, { type Bindings } from './index';

function makeEnv(overrides: Partial<Bindings> = {}): Bindings {
  return { LOG_LEVEL: 'error', DB: new FakeD1(), ...overrides };
}

describe('apps/cloud routes', () => {
  it('GET /healthz returns ok', async () => {
    const res = await app.request('/healthz', undefined, makeEnv());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: 'ok' });
  });

  it('GET /version returns build info', async () => {
    const res = await app.request('/version', undefined, makeEnv());
    expect(res.status).toBe(200);
    const body: Record<string, unknown> = await res.json();
    expect(body.commit).toBeTruthy();
    expect(body.buildTime).toBeTruthy();
    expect(body.environment).toBe('unknown');
  });

  it('GET /version surfaces the SENTRY_ENVIRONMENT binding', async () => {
    const res = await app.request(
      '/version',
      undefined,
      makeEnv({ SENTRY_ENVIRONMENT: 'staging' }),
    );
    const body: Record<string, unknown> = await res.json();
    expect(body.environment).toBe('staging');
  });

  it('returns 404 for an unknown route', async () => {
    const res = await app.request('/missing', undefined, makeEnv());
    expect(res.status).toBe(404);
  });

  it('rejects /homes calls without a Bearer token', async () => {
    const res = await app.request(
      '/homes',
      undefined,
      makeEnv({ CLERK_ISSUER: 'https://test.clerk.dev' }),
    );
    expect(res.status).toBe(401);
  });

  it('returns 500 on /homes when CLERK_ISSUER is unset', async () => {
    const res = await app.request('/homes', undefined, makeEnv());
    expect(res.status).toBe(500);
  });
});
