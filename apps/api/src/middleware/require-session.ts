// Hono middleware that gates a route on a valid session JWT (#418).
//
// Token lookup order:
//   1. `Authorization: Bearer <jwt>` header — mobile path.
//   2. `glaon_api_session` cookie — web path (set as httpOnly + Secure +
//      SameSite=Strict by /auth/exchange).
//
// Verification: signature + expiry via `verifySessionJwt`, then a
// revocation-list lookup. On success the user id is attached to the
// Hono context as `c.var.userId` for downstream handlers.

import type { MiddlewareHandler } from 'hono';

import { verifySessionJwt } from '../auth/jwt';
import type { RevocationStore } from '../auth/revocation';

export const SESSION_COOKIE_NAME = 'glaon_api_session';

interface RequireSessionDeps {
  readonly secret: Uint8Array;
  readonly revocations: RevocationStore;
}

export interface SessionVariables {
  userId: string;
  sessionJti: string;
}

export function requireSession(deps: RequireSessionDeps): MiddlewareHandler<{
  Variables: SessionVariables;
}> {
  return async (c, next) => {
    const token = readToken(c.req.raw);
    if (token === null) {
      return c.json({ error: 'unauthorized', code: 'no-session' }, 401);
    }
    const claims = await verifySessionJwt(deps.secret, token);
    if (claims === null) {
      return c.json({ error: 'unauthorized', code: 'invalid-session' }, 401);
    }
    if (await deps.revocations.isRevoked(claims.jti)) {
      return c.json({ error: 'unauthorized', code: 'revoked-session' }, 401);
    }
    c.set('userId', claims.sub);
    c.set('sessionJti', claims.jti);
    await next();
    return undefined;
  };
}

function readToken(req: Request): string | null {
  const auth = req.headers.get('Authorization');
  if (auth?.startsWith('Bearer ') === true) {
    const token = auth.slice('Bearer '.length).trim();
    if (token.length > 0) return token;
  }
  const cookieHeader = req.headers.get('Cookie');
  if (cookieHeader === null) return null;
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${SESSION_COOKIE_NAME}=`)) {
      const value = trimmed.slice(SESSION_COOKIE_NAME.length + 1);
      if (value.length > 0) return value;
    }
  }
  return null;
}
