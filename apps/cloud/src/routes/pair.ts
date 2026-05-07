// Pairing endpoints per ADR 0021 + issue #346.
//
// /pair/initiate (Clerk-authed): mint a 6-digit code, single-use, 10-min TTL,
//   bound to the caller. Per-user rate limit: 5 initiations per 60s window.
//
// /pair/claim (unauthenticated): addon redeems the code, gets a fresh
//   relay_secret. Per-IP rate limit: 10 attempts/min, exponential lockout on
//   bad codes (1 min → 5 min → 30 min → 60 min).
//
// /pair/status?code=... (Clerk-authed): client polls for the claim.

import { hash } from 'bcryptjs';
import { Hono } from 'hono';

import { requireClerkSession } from '../auth/clerk';
import { HomeRegistryRepo } from '../db/repo';
import { PairCodeRepo } from '../db/pair-repo';
import { generatePairCode, generateRelaySecret, PAIR_CODE_TTL_MS } from '../pairing/code';
import type { AppEnv } from '../index';

const PER_USER_INITIATE_LIMIT = 5;
const PER_USER_INITIATE_WINDOW_MS = 60_000;
const PER_IP_BAD_CLAIM_THRESHOLD = 10;
const LOCKOUT_TIERS_MS = [60_000, 5 * 60_000, 30 * 60_000, 60 * 60_000];

export const pairRouter = new Hono<AppEnv>();

interface ClaimBody {
  readonly code?: unknown;
}

/* -------- middleware: Clerk for /initiate + /status -------- */

pairRouter.use('/initiate', clerkOnly());
pairRouter.use('/status', clerkOnly());

function clerkOnly() {
  return async (
    c: Parameters<ReturnType<typeof requireClerkSession>>[0],
    next: () => Promise<void>,
  ) => {
    const issuer = c.env.CLERK_ISSUER;
    if (issuer === undefined || issuer.length === 0) {
      return c.json({ error: 'misconfigured', code: 'no-clerk-issuer' }, 500);
    }
    return requireClerkSession({ issuer })(c, next);
  };
}

/* -------- per-user initiate rate limiting (in-memory) --------
 * 5 initiations per 60s window per Clerk user. Per-Worker isolate; a single
 * Worker dyno handles each request, so this lives in-process. Clusters of
 * isolates do not share state — that's acceptable at this scale; if a real
 * abuse pattern shows up we move this to Durable Object or KV. */

const initiateRateLimiter = new Map<string, number[]>();

function trackInitiateAttempt(clerkUserId: string, now: number): boolean {
  const recent = initiateRateLimiter.get(clerkUserId) ?? [];
  const windowStart = now - PER_USER_INITIATE_WINDOW_MS;
  const inWindow = recent.filter((ts) => ts > windowStart);
  if (inWindow.length >= PER_USER_INITIATE_LIMIT) {
    initiateRateLimiter.set(clerkUserId, inWindow);
    return false;
  }
  inWindow.push(now);
  initiateRateLimiter.set(clerkUserId, inWindow);
  return true;
}

/* -------- routes -------- */

pairRouter.post('/initiate', async (c) => {
  const clerkUserId = c.get('clerkUserId');
  const now = Date.now();
  if (!trackInitiateAttempt(clerkUserId, now)) {
    return c.json({ error: 'rate-limited', code: 'initiate-too-many' }, 429);
  }
  const code = generatePairCode();
  const expiresAt = now + PAIR_CODE_TTL_MS;
  const repo = new PairCodeRepo(c.env.DB);
  await repo.insertCode(code, clerkUserId, now, expiresAt);
  await new HomeRegistryRepo(c.env.DB).writeEvent(
    {
      type: 'pair_initiated',
      userId: null,
      homeId: null,
      ip: clientIp(c),
      userAgent: c.req.header('User-Agent'),
    },
    now,
  );
  return c.json({ code, expiresAt }, 201);
});

pairRouter.post('/claim', async (c) => {
  const ip = clientIp(c) ?? 'unknown';
  const now = Date.now();
  const pairRepo = new PairCodeRepo(c.env.DB);
  const homeRepo = new HomeRegistryRepo(c.env.DB);

  // 1. Lockout check.
  const failure = await pairRepo.getFailure(ip);
  if (
    failure?.locked_until !== undefined &&
    failure.locked_until !== null &&
    failure.locked_until > now
  ) {
    return c.json(
      {
        error: 'rate-limited',
        code: 'claim-locked',
        retryAfterMs: failure.locked_until - now,
      },
      429,
    );
  }

  // 2. Body parse.
  const body = (await c.req.json().catch(() => ({}))) as ClaimBody;
  if (typeof body.code !== 'string' || body.code.trim().length === 0) {
    return c.json({ error: 'invalid', code: 'code-required' }, 400);
  }
  const code = body.code.trim();

  // 3. Lookup + validate.
  const row = await pairRepo.findByCode(code);
  if (row === null) {
    await recordBadAttempt(pairRepo, homeRepo, ip, c.req.header('User-Agent'), failure, now);
    return c.json({ error: 'invalid', code: 'unknown-code' }, 401);
  }
  if (row.expires_at <= now) {
    await homeRepo.writeEvent(
      {
        type: 'pair_expired',
        userId: null,
        homeId: null,
        ip,
        userAgent: c.req.header('User-Agent'),
        reason: 'code_expired',
      },
      now,
    );
    return c.json({ error: 'expired', code: 'code-expired' }, 410);
  }
  if (row.claimed_at !== null) {
    await homeRepo.writeEvent(
      {
        type: 'pair_failed_invalid_code',
        userId: null,
        homeId: null,
        ip,
        userAgent: c.req.header('User-Agent'),
        reason: 'already_claimed',
      },
      now,
    );
    return c.json({ error: 'expired', code: 'code-already-claimed' }, 410);
  }

  // 4. Mint home + relay_secret.
  const user = await homeRepo.upsertUser(row.clerk_user_id, now);
  const homeId = crypto.randomUUID();
  await homeRepo.createHome(homeId, user.id, 'My home', now);
  const relaySecret = generateRelaySecret();
  const hashed = await hash(relaySecret, 10);
  await c.env.DB.prepare(
    'INSERT INTO relay_secrets_hash (home_id, hash, created_at) VALUES (?, ?, ?)',
  )
    .bind(homeId, hashed, now)
    .run();

  // 5. Atomic claim.
  const claimed = await pairRepo.claimCode(code, homeId, now);
  if (!claimed) {
    return c.json({ error: 'expired', code: 'concurrent-claim' }, 410);
  }
  await pairRepo.clearFailure(ip);
  await homeRepo.writeEvent(
    {
      type: 'pair_claimed',
      userId: user.id,
      homeId,
      ip,
      userAgent: c.req.header('User-Agent'),
    },
    now,
  );
  return c.json({
    homeId,
    relaySecret,
    cloudUrl: c.req.url.replace(/\/pair\/claim$/, ''),
  });
});

pairRouter.get('/status', async (c) => {
  const code = c.req.query('code');
  if (code === undefined || code.length === 0) {
    return c.json({ error: 'invalid', code: 'code-required' }, 400);
  }
  const clerkUserId = c.get('clerkUserId');
  const repo = new PairCodeRepo(c.env.DB);
  const row = await repo.findByCodeAndUser(code, clerkUserId);
  if (row === null) return c.json({ error: 'not-found' }, 404);
  if (row.claimed_at !== null) {
    return c.json({ status: 'claimed', homeId: row.claimed_home_id });
  }
  if (row.expires_at <= Date.now()) {
    return c.json({ status: 'expired' });
  }
  return c.json({ status: 'pending', expiresAt: row.expires_at });
});

/* -------- helpers -------- */

async function recordBadAttempt(
  pairRepo: PairCodeRepo,
  homeRepo: HomeRegistryRepo,
  ip: string,
  userAgent: string | undefined,
  prior: { attempts: number; locked_until: number | null } | null,
  now: number,
): Promise<void> {
  const attempts = (prior?.attempts ?? 0) + 1;
  let lockedUntil: number | null = prior?.locked_until ?? null;
  if (attempts >= PER_IP_BAD_CLAIM_THRESHOLD) {
    const tierIndex = Math.min(
      Math.floor((attempts - PER_IP_BAD_CLAIM_THRESHOLD) / PER_IP_BAD_CLAIM_THRESHOLD),
      LOCKOUT_TIERS_MS.length - 1,
    );
    const tier = LOCKOUT_TIERS_MS[tierIndex] ?? LOCKOUT_TIERS_MS[0] ?? 60_000;
    lockedUntil = now + tier;
  }
  await pairRepo.recordFailure(ip, attempts, lockedUntil);
  await homeRepo.writeEvent(
    {
      type: 'pair_failed_invalid_code',
      userId: null,
      homeId: null,
      ip,
      userAgent,
      reason: lockedUntil !== null && lockedUntil > now ? 'locked_out' : 'bad_code',
    },
    now,
  );
}

function clientIp(c: {
  req: { header: (name: string) => string | undefined };
}): string | undefined {
  return c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For');
}
