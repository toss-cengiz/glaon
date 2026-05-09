import { describe, expect, it } from 'vitest';

import { decodeSecret, mintSessionJwt, verifySessionJwt } from './jwt';

const SECRET = decodeSecret('a'.repeat(32));

describe('mintSessionJwt + verifySessionJwt', () => {
  it('round-trips a session JWT with the expected claims', async () => {
    const now = Math.floor(Date.now() / 1000);
    const { jwt, claims } = await mintSessionJwt(SECRET, {
      userId: 'user-1',
      now,
      ttlSeconds: 600,
    });
    expect(claims.sub).toBe('user-1');
    expect(claims.iat).toBe(now);
    expect(claims.exp).toBe(now + 600);
    const verified = await verifySessionJwt(SECRET, jwt);
    expect(verified).not.toBeNull();
    expect(verified?.sub).toBe('user-1');
    expect(verified?.jti).toBe(claims.jti);
  });

  it('rejects a JWT signed with a different secret', async () => {
    const { jwt } = await mintSessionJwt(SECRET, { userId: 'u', ttlSeconds: 60 });
    const otherSecret = decodeSecret('b'.repeat(32));
    expect(await verifySessionJwt(otherSecret, jwt)).toBeNull();
  });

  it('rejects an expired JWT', async () => {
    const past = Math.floor(Date.now() / 1000) - 3600;
    const { jwt } = await mintSessionJwt(SECRET, {
      userId: 'u',
      now: past,
      ttlSeconds: 60,
    });
    expect(await verifySessionJwt(SECRET, jwt)).toBeNull();
  });

  it('rejects garbage tokens', async () => {
    expect(await verifySessionJwt(SECRET, 'not-a-jwt')).toBeNull();
    expect(await verifySessionJwt(SECRET, '')).toBeNull();
  });
});

describe('decodeSecret', () => {
  it('throws when the secret is shorter than 32 bytes', () => {
    expect(() => decodeSecret('short')).toThrow(/at least 32 bytes/i);
  });

  it('returns a Uint8Array for valid input', () => {
    expect(decodeSecret('a'.repeat(32))).toBeInstanceOf(Uint8Array);
  });
});
