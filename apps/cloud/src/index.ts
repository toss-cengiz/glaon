// apps/cloud entry — Cloudflare Worker bootstrap. See ADR 0020 (CF Workers + DO),
// ADR 0018 (relay topology), ADR 0022 (deploy + secrets pipeline), and the B1
// scaffold issue (#343).
//
// This PR ships the bare minimum: healthcheck + version routes, structured logging
// stub, Sentry hookup point. Home registry (#344), WS relay endpoint (#345), and
// pairing endpoint (#346) layer their routes + Durable Objects on top in subsequent
// PRs. The shape here is stable — `Hono` keeps the route surface flat and
// composable.

import { Hono } from 'hono';

import { requireClerkSession } from './auth/clerk';
import type { D1Database } from './db/types';
import { createLogger } from './logger';
import { homesRouter } from './routes/homes';
import { initSentry, type SentryClient } from './sentry';

export interface Bindings {
  readonly LOG_LEVEL?: string;
  readonly SENTRY_DSN?: string;
  readonly SENTRY_ENVIRONMENT?: string;
  readonly SENTRY_RELEASE?: string;
  readonly CLERK_ISSUER?: string;
  readonly DB: D1Database;
}

export interface AppEnv {
  Bindings: Bindings;
  Variables: { sentry: SentryClient; clerkUserId: string };
}

const VERSION = {
  // Filled at build time by Wrangler — falls back to `dev` for local runs.
  commit: typeof process !== 'undefined' ? (process.env.GIT_SHA ?? 'dev') : 'dev',
  buildTime: typeof process !== 'undefined' ? (process.env.BUILD_TIME ?? 'dev') : 'dev',
};

const app = new Hono<AppEnv>();

app.use('*', async (c, next) => {
  const sentry = initSentry({
    dsn: c.env.SENTRY_DSN,
    environment: c.env.SENTRY_ENVIRONMENT,
    release: c.env.SENTRY_RELEASE,
  });
  c.set('sentry', sentry);
  const logger = createLogger({ level: c.env.LOG_LEVEL ?? 'info' });
  const start = Date.now();
  try {
    await next();
  } catch (cause) {
    sentry.captureException(cause);
    logger.error({
      msg: 'unhandled error',
      method: c.req.method,
      path: c.req.path,
      duration_ms: Date.now() - start,
    });
    throw cause;
  }
  logger.info({
    msg: 'request',
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration_ms: Date.now() - start,
  });
});

app.get('/healthz', (c) => c.json({ status: 'ok' }));

app.get('/version', (c) =>
  c.json({
    commit: VERSION.commit,
    buildTime: VERSION.buildTime,
    environment: c.env.SENTRY_ENVIRONMENT ?? 'unknown',
  }),
);

// Home registry — Clerk-authed CRUD per #344. Each route is gated by
// `requireClerkSession`; the cross-tenant guard lives inside the repo (every
// query filters by owner_user_id, returns null on miss to avoid existence leaks).
type ClerkContext = Parameters<ReturnType<typeof requireClerkSession>>[0];

app.use('/homes/*', async (c, next) => {
  const issuer = c.env.CLERK_ISSUER;
  if (issuer === undefined || issuer.length === 0) {
    return c.json({ error: 'misconfigured', code: 'no-clerk-issuer' }, 500);
  }
  const middleware = requireClerkSession({ issuer });
  return middleware(c as ClerkContext, next);
});
app.route('/homes', homesRouter);

export default app;
