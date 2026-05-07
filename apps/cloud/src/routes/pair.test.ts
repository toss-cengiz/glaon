import { compare } from 'bcryptjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FakeD1 } from '../db/fake';
import app, { type Bindings } from '../index';
import * as clerk from '../auth/clerk';

interface InitiateRes {
  code: string;
  expiresAt: number;
}

interface ClaimRes {
  homeId: string;
  relaySecret: string;
  cloudUrl: string;
}

interface StatusRes {
  status: 'pending' | 'claimed' | 'expired';
  homeId?: string;
}

function envFor(db: FakeD1): Bindings {
  return { LOG_LEVEL: 'error', DB: db, CLERK_ISSUER: 'https://test.clerk.dev' };
}

function authHeaders(token = 'tok'): Headers {
  return new Headers({ Authorization: `Bearer ${token}` });
}

function stubClerk(claimSub: string): void {
  vi.spyOn(clerk, 'requireClerkSession').mockReturnValue(async (c, next) => {
    c.set('clerkUserId', claimSub);
    await next();
    return undefined;
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('pair flow happy path', () => {
  it('initiate -> status pending -> claim -> status claimed', async () => {
    const db = new FakeD1();
    stubClerk('user_alice');

    // 1. initiate
    const initRes = await app.request(
      '/pair/initiate',
      { method: 'POST', headers: authHeaders() },
      envFor(db),
    );
    expect(initRes.status).toBe(201);
    const init: InitiateRes = await initRes.json();
    expect(init.code).toMatch(/^[2-9A-HJ-NP-Z]{6}$/);
    expect(init.expiresAt).toBeGreaterThan(Date.now());

    // 2. status (pending)
    const statusPending = await app.request(
      `/pair/status?code=${init.code}`,
      { headers: authHeaders() },
      envFor(db),
    );
    expect(statusPending.status).toBe(200);
    const pending: StatusRes = await statusPending.json();
    expect(pending.status).toBe('pending');

    // 3. claim
    const claimRes = await app.request(
      '/pair/claim',
      { method: 'POST', body: JSON.stringify({ code: init.code }) },
      envFor(db),
    );
    expect(claimRes.status).toBe(200);
    const claim: ClaimRes = await claimRes.json();
    expect(claim.homeId).toBeTruthy();
    expect(claim.relaySecret.length).toBeGreaterThan(20);

    // 4. relay_secret stored as bcrypt hash
    const stored = db.state.relaySecrets[0];
    expect(stored).toBeDefined();
    expect(stored?.hash).not.toBe(claim.relaySecret);
    if (stored !== undefined) {
      expect(await compare(claim.relaySecret, stored.hash)).toBe(true);
    }

    // 5. status (claimed)
    const statusClaimed = await app.request(
      `/pair/status?code=${init.code}`,
      { headers: authHeaders() },
      envFor(db),
    );
    const claimed: StatusRes = await statusClaimed.json();
    expect(claimed.status).toBe('claimed');
    expect(claimed.homeId).toBe(claim.homeId);
  });
});

describe('pair claim failure paths', () => {
  it('returns 401 for an unknown code and writes a pair_failed_invalid_code audit row', async () => {
    const db = new FakeD1();
    const res = await app.request(
      '/pair/claim',
      { method: 'POST', body: JSON.stringify({ code: 'NOPE99' }) },
      envFor(db),
    );
    expect(res.status).toBe(401);
    const events = db.state.events.map((e) => e.event_type);
    expect(events).toContain('pair_failed_invalid_code');
  });

  it('returns 410 when the same code is claimed twice', async () => {
    const db = new FakeD1();
    stubClerk('user_alice');
    const init: InitiateRes = await (
      await app.request('/pair/initiate', { method: 'POST', headers: authHeaders() }, envFor(db))
    ).json();
    const first = await app.request(
      '/pair/claim',
      { method: 'POST', body: JSON.stringify({ code: init.code }) },
      envFor(db),
    );
    expect(first.status).toBe(200);

    const second = await app.request(
      '/pair/claim',
      { method: 'POST', body: JSON.stringify({ code: init.code }) },
      envFor(db),
    );
    expect(second.status).toBe(410);
  });

  it('returns 410 when the code is expired', async () => {
    const db = new FakeD1();
    stubClerk('user_alice');
    const init: InitiateRes = await (
      await app.request('/pair/initiate', { method: 'POST', headers: authHeaders() }, envFor(db))
    ).json();

    // Force expiry by mutating the FakeD1 state directly.
    const stored = db.state.pairCodes.find((p) => p.code === init.code);
    if (stored) stored.expires_at = Date.now() - 1;

    const res = await app.request(
      '/pair/claim',
      { method: 'POST', body: JSON.stringify({ code: init.code }) },
      envFor(db),
    );
    expect(res.status).toBe(410);
  });

  it('locks out the IP after 10 bad-code attempts', async () => {
    const db = new FakeD1();
    const headers = new Headers({ 'CF-Connecting-IP': '1.2.3.4' });
    for (let i = 0; i < 10; i++) {
      await app.request(
        '/pair/claim',
        { method: 'POST', headers, body: JSON.stringify({ code: `NOPE${String(i)}` }) },
        envFor(db),
      );
    }
    const lockedRes = await app.request(
      '/pair/claim',
      { method: 'POST', headers, body: JSON.stringify({ code: 'NOPE99' }) },
      envFor(db),
    );
    expect(lockedRes.status).toBe(429);
    const body: { code: string; retryAfterMs: number } = await lockedRes.json();
    expect(body.code).toBe('claim-locked');
    expect(body.retryAfterMs).toBeGreaterThan(0);
  });
});

describe('pair status visibility', () => {
  it('only the initiating user can see their pair code status', async () => {
    const db = new FakeD1();
    stubClerk('user_alice');
    const init: InitiateRes = await (
      await app.request('/pair/initiate', { method: 'POST', headers: authHeaders() }, envFor(db))
    ).json();

    // Bob looks up Alice's code via /status — must surface as 404.
    stubClerk('user_bob');
    const res = await app.request(
      `/pair/status?code=${init.code}`,
      { headers: authHeaders() },
      envFor(db),
    );
    expect(res.status).toBe(404);
  });
});
