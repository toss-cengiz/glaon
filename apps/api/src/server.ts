// Hono app factory per ADR 0025. The factory takes its dependencies as
// arguments rather than reaching into globals, so unit tests can hand in
// a stub Mongo + config without spinning up a real driver.

import { Hono } from 'hono';
import type { Db } from 'mongodb';

import { decodeSecret } from './auth/jwt';
import { MongoRevocationStore, type RevocationStore } from './auth/revocation';
import type { Config } from './config';
import { pingDb } from './db';
import { observabilityMiddleware } from './middleware/observability';
import { createLogger, type Logger } from './observability/logger';
import { Metrics } from './observability/metrics';
import { createAuthRouter } from './routes/auth';
import { createLayoutsRouter } from './routes/layouts';

export interface ServerDeps {
  readonly db: Db;
  readonly config: Config;
  readonly revocations?: RevocationStore;
  readonly fetchImpl?: typeof fetch;
  readonly logger?: Logger;
  readonly metrics?: Metrics;
}

export function createServer(deps: ServerDeps): Hono {
  const app = new Hono();
  const secret = decodeSecret(deps.config.sessionJwtSecret);
  const revocations = deps.revocations ?? new MongoRevocationStore(deps.db);
  const logger = deps.logger ?? createLogger({ level: deps.config.logLevel });
  const metrics = deps.metrics ?? new Metrics();

  app.use('*', observabilityMiddleware({ logger, metrics }));

  app.route(
    '/auth',
    createAuthRouter({
      secret,
      revocations,
      webOrigins: deps.config.webOrigins,
      sessionTtlSeconds: deps.config.sessionTtlSeconds,
      ...(deps.fetchImpl !== undefined ? { fetchImpl: deps.fetchImpl } : {}),
    }),
  );

  app.route('/layouts', createLayoutsRouter({ db: deps.db, secret, revocations }));

  // Liveness probe with Mongo ping. Returns 200 when the driver
  // command succeeds, 503 otherwise so a load balancer can drop the
  // instance from rotation. The metrics gauge is updated on every
  // call so /metrics surfaces the latest observation.
  app.get('/healthz', async (c) => {
    const result = await pingDb(deps.db);
    metrics.setMongoPing(result.latencyMs);
    return c.json(
      {
        status: result.ok ? 'ok' : 'degraded',
        mongo: result,
        version: deps.config.buildInfo.version,
        commit: deps.config.buildInfo.commit,
      },
      result.ok ? 200 : 503,
    );
  });

  // Build info — useful for the deploy pipeline + manual debugging.
  app.get('/version', (c) => {
    return c.json({
      version: deps.config.buildInfo.version,
      commit: deps.config.buildInfo.commit,
      builtAt: deps.config.buildInfo.builtAt,
    });
  });

  // Prometheus-style text exposition (#423). Minimal subset — process
  // uptime, request counts (method/route/status), latest mongo ping.
  app.get('/metrics', (c) => {
    return c.text(metrics.render(), 200, { 'Content-Type': 'text/plain; version=0.0.4' });
  });

  return app;
}
