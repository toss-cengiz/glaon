// Hono middleware that wires up the per-request observability:
//   1. Generates a UUID request id (or accepts X-Request-Id from a
//      trusted proxy — Phase 2 scope assumes clients won't forge it,
//      but the cloud-relay deploy already gates origin so a malicious
//      actor can't trivially set it).
//   2. Stashes the request context into AsyncLocalStorage so log calls
//      anywhere in the handler chain auto-include it.
//   3. Echoes `X-Request-Id` back on the response.
//   4. Emits a single `request` log line on completion with method,
//      path, status, duration_ms.
//   5. Records the request in the Metrics counter.

import type { MiddlewareHandler } from 'hono';

import { requestContextStore, type Logger, type RequestContext } from '../observability/logger';
import type { Metrics } from '../observability/metrics';

interface ObservabilityDeps {
  readonly logger: Logger;
  readonly metrics: Metrics;
  readonly newRequestId?: () => string;
}

export function observabilityMiddleware(deps: ObservabilityDeps): MiddlewareHandler {
  const newRequestId = deps.newRequestId ?? (() => crypto.randomUUID());
  return async (c, next) => {
    const incoming = c.req.header('X-Request-Id');
    const requestId =
      incoming !== undefined && /^[A-Za-z0-9_.-]{8,128}$/.test(incoming)
        ? incoming
        : newRequestId();
    const ctx: RequestContext = {
      requestId,
      method: c.req.method,
      path: c.req.path,
      startedAt: Date.now(),
    };
    c.header('X-Request-Id', requestId);
    await requestContextStore.run(ctx, async () => {
      try {
        await next();
      } finally {
        const status = c.res.status;
        const durationMs = Date.now() - ctx.startedAt;
        deps.logger.info({
          msg: 'request',
          method: ctx.method,
          path: ctx.path,
          status,
          duration_ms: durationMs,
        });
        deps.metrics.observeRequest({
          method: ctx.method,
          route: routeOf(ctx.path),
          status,
        });
      }
    });
  };
}

// Collapse param-laden paths into a route shape suitable for metric
// labels. `/layouts/abc-123` → `/layouts/:id`. We intentionally do NOT
// run the full Hono route registry — keeping a tight allowlist keeps
// label cardinality bounded.
const ROUTE_PATTERNS: [RegExp, string][] = [[/^\/layouts\/[^/]+$/, '/layouts/:id']];

function routeOf(path: string): string {
  for (const [pattern, label] of ROUTE_PATTERNS) {
    if (pattern.test(path)) return label;
  }
  return path;
}
