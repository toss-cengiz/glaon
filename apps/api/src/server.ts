// Hono app factory per ADR 0025. The factory takes its dependencies as
// arguments rather than reaching into globals, so unit tests can hand in
// a stub Mongo + config without spinning up a real driver.

import { Hono } from 'hono';
import type { Db } from 'mongodb';

import type { Config } from './config';
import { pingDb } from './db';

export interface ServerDeps {
  readonly db: Db;
  readonly config: Config;
}

export function createServer(deps: ServerDeps): Hono {
  const app = new Hono();

  // Liveness probe with Mongo ping. Returns 200 when the driver
  // command succeeds, 503 otherwise so a load balancer can drop the
  // instance from rotation.
  app.get('/healthz', async (c) => {
    const result = await pingDb(deps.db);
    return c.json({ status: result.ok ? 'ok' : 'degraded', mongo: result }, result.ok ? 200 : 503);
  });

  // Build info — useful for the deploy pipeline + manual debugging.
  app.get('/version', (c) => {
    return c.json({
      version: deps.config.buildInfo.version,
      commit: deps.config.buildInfo.commit,
      builtAt: deps.config.buildInfo.builtAt,
    });
  });

  return app;
}
