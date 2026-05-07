// Clerk JWT verification — ADR 0019 (Clerk as cloud IdP). The middleware parses the
// `Authorization: Bearer <jwt>` header, verifies the token against Clerk's published
// JWKS (cached in-memory per worker isolate), and exposes `clerkUserId` to handlers
// via Hono context variables.
//
// Glaon never exchanges Clerk tokens for HA tokens; HA OAuth tokens stay local-only
// per ADR 0017 risk invariant. This middleware authorizes API calls only.

import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyResult } from 'jose';
import type { MiddlewareHandler } from 'hono';

import type { AppEnv } from '../index';

interface CachedJwks {
  readonly issuerUrl: string;
  readonly getter: ReturnType<typeof createRemoteJWKSet>;
}

let cachedJwks: CachedJwks | null = null;

function getJwks(issuerUrl: string): CachedJwks['getter'] {
  if (cachedJwks !== null && cachedJwks.issuerUrl === issuerUrl) {
    return cachedJwks.getter;
  }
  const url = new URL('/.well-known/jwks.json', issuerUrl);
  const getter = createRemoteJWKSet(url, { cooldownDuration: 30_000 });
  cachedJwks = { issuerUrl, getter };
  return getter;
}

export interface ClerkClaims extends JWTPayload {
  /** Clerk user identifier (`user_<id>`). */
  readonly sub: string;
}

/**
 * Hono middleware that requires a valid Clerk session JWT in the `Authorization`
 * header. Sets `c.set('clerkUserId', sub)` for downstream handlers.
 *
 * Test injection seam: `verify` is overridable so the suite stubs `jwtVerify` without
 * a real Clerk JWKS endpoint.
 */
export function requireClerkSession(options: {
  /** Clerk issuer URL (e.g. `https://your-app.clerk.accounts.dev`). */
  readonly issuer: string;
  /** Optional verify override for tests. */
  readonly verify?: (token: string) => Promise<JWTVerifyResult>;
}): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const header = c.req.header('Authorization');
    if (!header?.startsWith('Bearer ')) {
      return c.json({ error: 'unauthorized', code: 'no-bearer-token' }, 401);
    }
    const token = header.slice('Bearer '.length).trim();
    if (token.length === 0) {
      return c.json({ error: 'unauthorized', code: 'empty-bearer-token' }, 401);
    }
    let result: JWTVerifyResult;
    try {
      const verify =
        options.verify ??
        (async (t: string) => {
          const jwks = getJwks(options.issuer);
          return jwtVerify(t, jwks, {
            issuer: options.issuer,
          });
        });
      result = await verify(token);
    } catch (cause) {
      return c.json(
        {
          error: 'unauthorized',
          code: 'invalid-token',
          message: cause instanceof Error ? cause.message : 'token verification failed',
        },
        401,
      );
    }
    const claims = result.payload as ClerkClaims;
    if (typeof claims.sub !== 'string' || claims.sub.length === 0) {
      return c.json({ error: 'unauthorized', code: 'missing-sub' }, 401);
    }
    c.set('clerkUserId', claims.sub);
    await next();
    return undefined;
  };
}
