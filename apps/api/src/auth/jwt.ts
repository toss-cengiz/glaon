// Session JWT minter + verifier per ADR 0017 + #418. HS256 over a
// symmetric key from `SESSION_JWT_SECRET`. The session JWT is
// independent of HA and Clerk — it is what `apps/api` issues to the
// caller after validating their HA access token, and it is the credential
// the rest of the apps/api routes consume.

import { jwtVerify, SignJWT } from 'jose';

const ISSUER = 'glaon-api';

interface SessionClaims {
  readonly sub: string;
  readonly jti: string;
  readonly iat: number;
  readonly exp: number;
}

interface MintOptions {
  readonly userId: string;
  readonly ttlSeconds?: number;
  readonly now?: number;
}

const DEFAULT_TTL_SECONDS = 60 * 60; // 1h

export async function mintSessionJwt(
  secret: Uint8Array,
  options: MintOptions,
): Promise<{ jwt: string; claims: SessionClaims }> {
  const now = options.now ?? Math.floor(Date.now() / 1000);
  const ttl = options.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const exp = now + ttl;
  const jti = crypto.randomUUID();
  const jwt = await new SignJWT({ jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setSubject(options.userId)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setJti(jti)
    .sign(secret);
  return { jwt, claims: { sub: options.userId, jti, iat: now, exp } };
}

export async function verifySessionJwt(
  secret: Uint8Array,
  token: string,
): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: ISSUER });
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.jti !== 'string' ||
      typeof payload.iat !== 'number' ||
      typeof payload.exp !== 'number'
    ) {
      return null;
    }
    return { sub: payload.sub, jti: payload.jti, iat: payload.iat, exp: payload.exp };
  } catch {
    return null;
  }
}

export function decodeSecret(raw: string): Uint8Array {
  const enc = new TextEncoder();
  const bytes = enc.encode(raw);
  if (bytes.length < 32) {
    throw new Error('SESSION_JWT_SECRET must be at least 32 bytes (use a 256-bit random value)');
  }
  return bytes;
}
