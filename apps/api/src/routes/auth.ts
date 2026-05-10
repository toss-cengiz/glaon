// /auth/* routes per #418 + #468. Surfaces:
//   POST /auth/exchange — body { haAccessToken, haBaseUrl } →
//     validates the HA token, mints a session JWT, returns
//     { sessionJwt, expiresAt }. Sets a Set-Cookie header for web
//     clients (Origin matches the configured webOrigin allowlist).
//   POST /auth/refresh — body { sessionJwt } → re-mints the session
//     if it's still valid + non-revoked. The cookie path mirrors
//     /auth/exchange.
//   POST /auth/logout — adds the current session JWT's jti to the
//     revocation list. No-op for non-authenticated callers.
//   POST /auth/ha/password-grant — body { haBaseUrl, username, password,
//     clientId } → drives HA's /auth/login_flow on the caller's behalf,
//     returns { haAccess, sessionJwt, expiresAt }. The Glaon Device-tab
//     login uses this so the end user never sees HA's redirect UI
//     (#468 / ADR 0027). The HA refresh token is NOT persisted server-
//     side — it only flows back to the caller in the response body.

import { Hono } from 'hono';

import {
  AuthExchangeRequestSchema as ExchangeBody,
  AuthRefreshRequestSchema as RefreshBody,
  HaPasswordGrantRequestSchema as PasswordGrantBody,
} from '../schemas';
import { introspectHaToken, loginFlow, deriveUserId } from '../auth/ha-bridge';
import { mintSessionJwt, verifySessionJwt } from '../auth/jwt';
import type { RevocationStore } from '../auth/revocation';
import { SESSION_COOKIE_NAME } from '../middleware/require-session';

interface AuthRouterDeps {
  readonly secret: Uint8Array;
  readonly revocations: RevocationStore;
  readonly webOrigins: readonly string[];
  readonly sessionTtlSeconds?: number;
  readonly fetchImpl?: typeof fetch;
}

export function createAuthRouter(deps: AuthRouterDeps): Hono {
  const router = new Hono();
  const ttl = deps.sessionTtlSeconds ?? 60 * 60;

  router.post('/exchange', async (c) => {
    const body: unknown = await c.req.json().catch(() => null);
    const parsed = ExchangeBody.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'invalid', code: 'bad-body' }, 400);
    }
    const result = await introspectHaToken(parsed.data.haBaseUrl, parsed.data.haAccessToken, {
      ...(deps.fetchImpl !== undefined ? { fetchImpl: deps.fetchImpl } : {}),
    });
    if (!result.ok) {
      const status = result.reason === 'unauthorized' ? 401 : 502;
      return c.json({ error: 'ha-introspection-failed', code: result.reason }, status);
    }
    const { jwt, claims } = await mintSessionJwt(deps.secret, {
      userId: result.userId,
      ttlSeconds: ttl,
    });
    setCookieIfWebOrigin(c, deps.webOrigins, jwt, claims.exp);
    return c.json({ sessionJwt: jwt, expiresAt: claims.exp * 1000 });
  });

  router.post('/ha/password-grant', async (c) => {
    const body: unknown = await c.req.json().catch(() => null);
    const parsed = PasswordGrantBody.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'invalid', code: 'bad-body' }, 400);
    }
    const result = await loginFlow(
      parsed.data.haBaseUrl,
      {
        username: parsed.data.username,
        password: parsed.data.password,
        clientId: parsed.data.clientId,
      },
      {
        ...(deps.fetchImpl !== undefined ? { fetchImpl: deps.fetchImpl } : {}),
      },
    );
    if (!result.ok) {
      const status = ((): 400 | 401 | 502 => {
        switch (result.reason) {
          case 'invalid-url':
            return 400;
          case 'invalid-credentials':
            return 401;
          default:
            return 502;
        }
      })();
      return c.json({ error: result.reason }, status);
    }
    const { jwt, claims } = await mintSessionJwt(deps.secret, {
      userId: deriveUserId(result.accessToken),
      ttlSeconds: ttl,
    });
    setCookieIfWebOrigin(c, deps.webOrigins, jwt, claims.exp);
    return c.json({
      haAccess: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        tokenType: 'Bearer' as const,
      },
      sessionJwt: jwt,
      expiresAt: claims.exp * 1000,
    });
  });

  router.post('/refresh', async (c) => {
    const body: unknown = await c.req.json().catch(() => null);
    const parsed = RefreshBody.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'invalid', code: 'bad-body' }, 400);
    }
    const claims = await verifySessionJwt(deps.secret, parsed.data.sessionJwt);
    if (claims === null) {
      return c.json({ error: 'unauthorized', code: 'invalid-session' }, 401);
    }
    if (await deps.revocations.isRevoked(claims.jti)) {
      return c.json({ error: 'unauthorized', code: 'revoked-session' }, 401);
    }
    const minted = await mintSessionJwt(deps.secret, {
      userId: claims.sub,
      ttlSeconds: ttl,
    });
    setCookieIfWebOrigin(c, deps.webOrigins, minted.jwt, minted.claims.exp);
    return c.json({ sessionJwt: minted.jwt, expiresAt: minted.claims.exp * 1000 });
  });

  router.post('/logout', async (c) => {
    const auth = c.req.header('Authorization');
    let token: string | null = null;
    if (auth?.startsWith('Bearer ') === true) {
      token = auth.slice('Bearer '.length).trim();
    } else {
      const body: unknown = await c.req.json().catch(() => null);
      const parsed = RefreshBody.safeParse(body);
      if (parsed.success) token = parsed.data.sessionJwt;
    }
    if (token === null || token.length === 0) {
      return c.json({ error: 'invalid', code: 'no-session' }, 400);
    }
    const claims = await verifySessionJwt(deps.secret, token);
    if (claims === null) {
      // Even invalid JWTs return 200 — logout is idempotent and we
      // don't want to leak signature validity to a caller. Clear the
      // cookie just in case.
      clearSessionCookie(c, deps.webOrigins);
      return c.json({ ok: true });
    }
    await deps.revocations.revoke(claims.jti, claims.sub, claims.exp);
    clearSessionCookie(c, deps.webOrigins);
    return c.json({ ok: true });
  });

  return router;
}

interface CookieContext {
  req: { header: (name: string) => string | undefined };
  header: (name: string, value: string, options?: { append?: boolean }) => void;
}

function setCookieIfWebOrigin(
  c: CookieContext,
  webOrigins: readonly string[],
  jwt: string,
  expSeconds: number,
): void {
  const origin = c.req.header('Origin');
  if (origin === undefined || !webOrigins.includes(origin)) return;
  const maxAge = Math.max(0, expSeconds - Math.floor(Date.now() / 1000));
  c.header(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${jwt}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${String(maxAge)}`,
    { append: true },
  );
}

function clearSessionCookie(c: CookieContext, webOrigins: readonly string[]): void {
  const origin = c.req.header('Origin');
  if (origin === undefined || !webOrigins.includes(origin)) return;
  c.header(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
    { append: true },
  );
}
