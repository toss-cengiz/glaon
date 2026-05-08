// Relay upgrade endpoints — issue #345 + ADR 0018.
//
// `/relay/agent`: addon connects with `Authorization: Bearer <relay_secret>`.
// The cloud relay verifies against the bcrypt hash stored when pairing landed
// (#346 / ADR 0021), opens a WebSocketPair, and hands the server side to the
// per-home Durable Object.
//
// `/relay/client`: web/mobile client connects with a Clerk JWT in the
// `Authorization` header. The relay verifies the JWT, looks up home ownership
// in the registry (#344), and forwards the server side of the upgrade to the
// matching DO.
//
// Both upgrades are opaque-payload-forward only — the relay does not parse
// `ha_ws_frame.payload`. PII discipline per ADR 0018 risk C14.

import { Hono } from 'hono';

import { requireClerkSession } from '../auth/clerk';
import { RelaySecretVerifier } from '../auth/relay-secret';
import { HomeRegistryRepo } from '../db/repo';
import type { AppEnv } from '../index';

export const relayRouter = new Hono<AppEnv>();

relayRouter.get('/agent', async (c) => {
  const upgrade = c.req.header('Upgrade');
  if (upgrade !== 'websocket') return c.json({ error: 'expected-websocket-upgrade' }, 426);
  // Accept home id from X-Glaon-Home header (preferred) or ?home= query string.
  // Header path keeps the WebSocket URL on the agent side fully literal — the
  // CodeQL `js/file-access-to-http` taint check flags any /data/options.json
  // value flowing into the WS URL, so the agent passes home_id via header.
  const homeId = c.req.header('X-Glaon-Home') ?? c.req.query('home');
  if (homeId === undefined || homeId.length === 0) {
    return c.json({ error: 'home-required' }, 400);
  }
  const auth = c.req.header('Authorization');
  if (auth?.startsWith('Bearer ') !== true) {
    return c.json({ error: 'unauthorized', code: 'no-bearer' }, 401);
  }
  const secret = auth.slice('Bearer '.length).trim();
  const verifier = new RelaySecretVerifier(c.env.DB);
  const ok = await verifier.verify(homeId, secret);
  if (!ok) {
    await new HomeRegistryRepo(c.env.DB).writeEvent(
      {
        type: 'relay_agent_unauthorized',
        userId: null,
        homeId,
        reason: 'invalid_relay_secret',
      },
      Date.now(),
    );
    return c.json({ error: 'unauthorized', code: 'invalid-secret' }, 401);
  }
  return upgradeToDo(c, homeId, 'agent', `agent:${homeId}`);
});

relayRouter.get('/client', async (c, next) => {
  const issuer = c.env.CLERK_ISSUER;
  if (issuer === undefined || issuer.length === 0) {
    return c.json({ error: 'misconfigured', code: 'no-clerk-issuer' }, 500);
  }
  const upgrade = c.req.header('Upgrade');
  if (upgrade !== 'websocket') return c.json({ error: 'expected-websocket-upgrade' }, 426);
  const middleware = requireClerkSession({ issuer });
  await middleware(c, next);
  if (c.res.status === 401) return c.res;

  const homeId = c.req.query('home');
  if (homeId === undefined || homeId.length === 0) {
    return c.json({ error: 'home-query-required' }, 400);
  }
  const repo = new HomeRegistryRepo(c.env.DB);
  const user = await repo.upsertUser(c.get('clerkUserId'), Date.now());
  const owned = await repo.getHome(homeId, user.id);
  if (owned === null) {
    return c.json({ error: 'not-found' }, 404);
  }
  const sessionId = crypto.randomUUID();
  return upgradeToDo(c, homeId, 'client', `client:${sessionId}`);
});

interface RelayContext {
  readonly env: AppEnv['Bindings'];
}

async function upgradeToDo(
  c: RelayContext & {
    req: { url: string };
    json: (body: unknown, status?: number) => Response;
  },
  homeId: string,
  role: 'agent' | 'client',
  tag: string,
): Promise<Response> {
  const ns = c.env.HOME_SESSION_DO;
  if (ns === undefined) {
    return c.json({ error: 'misconfigured', code: 'no-home-do' }, 500);
  }
  const id = ns.idFromName(homeId);
  const stub = ns.get(id);
  // The DO `fetch` handler accepts the upgrade and calls `acceptPeer` with the
  // role tag. The actual handshake is a hand-off — the relay route here owns
  // only the auth path; the wire is the DO's after this.
  const headers = new Headers();
  headers.set('Upgrade', 'websocket');
  headers.set('X-Relay-Role', role);
  headers.set('X-Relay-Tag', tag);
  headers.set('X-Relay-Home', homeId);
  return stub.fetch(c.req.url, { headers });
}
