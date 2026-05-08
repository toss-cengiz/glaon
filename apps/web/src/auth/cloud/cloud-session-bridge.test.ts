import { describe, expect, it } from 'vitest';

import { InMemoryTokenStore } from '@glaon/core/auth';

import { decodeJwtExp, syncCloudSession, type ClerkLikeAuth } from './cloud-session-bridge';

function makeJwt(claims: Record<string, unknown>): string {
  const header = { alg: 'none', typ: 'JWT' };
  return [base64Url(JSON.stringify(header)), base64Url(JSON.stringify(claims)), 'sig'].join('.');
}

function base64Url(payload: string): string {
  return Buffer.from(payload)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

describe('decodeJwtExp', () => {
  it("returns the payload's `exp` (in ms) when present", () => {
    const oneHourFromNowSec = Math.floor(Date.now() / 1000) + 3600;
    const token = makeJwt({ sub: 'user_1', exp: oneHourFromNowSec });
    expect(decodeJwtExp(token)).toBe(oneHourFromNowSec * 1000);
  });

  it('returns 0 when exp is missing or non-numeric', () => {
    expect(decodeJwtExp(makeJwt({ sub: 'user_1' }))).toBe(0);
    expect(decodeJwtExp(makeJwt({ exp: 'tomorrow' }))).toBe(0);
  });

  it('returns 0 for malformed tokens', () => {
    expect(decodeJwtExp('not.a.token-with-bad-payload')).toBe(0);
    expect(decodeJwtExp('one-segment')).toBe(0);
    expect(decodeJwtExp('two.segments')).toBe(0);
  });
});

describe('syncCloudSession', () => {
  it('writes the token + decoded expiresAt to the cloud-session slot', async () => {
    const store = new InMemoryTokenStore();
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = makeJwt({ sub: 'user_1', exp });
    const auth: ClerkLikeAuth = { isSignedIn: true, getToken: () => Promise.resolve(token) };

    const result = await syncCloudSession(auth, store);

    expect(result.written).toBe(true);
    const stored = await store.get('cloud-session');
    expect(stored).toEqual({ kind: 'cloud-session', token, expiresAt: exp * 1000 });
  });

  it('clears the slot when Clerk reports signed-out', async () => {
    const store = new InMemoryTokenStore();
    await store.set({ kind: 'cloud-session', token: 'old', expiresAt: 9_999_999 });

    const auth: ClerkLikeAuth = { isSignedIn: false, getToken: () => Promise.resolve('ignored') };
    const result = await syncCloudSession(auth, store);

    expect(result.written).toBe(false);
    expect(await store.get('cloud-session')).toBeNull();
  });

  it('clears the slot when Clerk returns a null token even if signed-in flag is true', async () => {
    const store = new InMemoryTokenStore();
    await store.set({ kind: 'cloud-session', token: 'old', expiresAt: 9_999_999 });

    const auth: ClerkLikeAuth = { isSignedIn: true, getToken: () => Promise.resolve(null) };
    const result = await syncCloudSession(auth, store);

    expect(result.written).toBe(false);
    expect(await store.get('cloud-session')).toBeNull();
  });
});
