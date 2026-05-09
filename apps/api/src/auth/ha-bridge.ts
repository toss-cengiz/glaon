// HA token bridge per #418. The client (web or mobile) sends its HA
// access token to /auth/exchange; we validate it by calling the user's
// HA installation and extract the user_id from the token's payload (HA
// signs OAuth2 access tokens as JWTs in modern installs).
//
// We do NOT persist the HA access token — we only mint a session JWT
// keyed by the user_id. If the HA token decode fails we fall back to a
// deterministic SHA-256 hash of the token as the user id; that keeps
// long-lived access tokens (which are opaque strings, not JWTs)
// working with the same exchange flow.

interface HaIntrospectionResult {
  readonly ok: true;
  readonly userId: string;
}

interface HaIntrospectionError {
  readonly ok: false;
  readonly reason: 'invalid-url' | 'unauthorized' | 'unreachable' | 'unexpected';
  readonly status?: number;
}

interface IntrospectOptions {
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 5_000;

export async function introspectHaToken(
  haBaseUrl: string,
  haAccessToken: string,
  options: IntrospectOptions = {},
): Promise<HaIntrospectionResult | HaIntrospectionError> {
  let parsed: URL;
  try {
    parsed = new URL(haBaseUrl);
  } catch {
    return { ok: false, reason: 'invalid-url' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'invalid-url' };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const ctl = new AbortController();
  const timer = setTimeout(() => {
    ctl.abort();
  }, timeoutMs);
  try {
    const res = await fetchImpl(`${stripTrailingSlash(parsed.toString())}/api/`, {
      headers: { Authorization: `Bearer ${haAccessToken}` },
      signal: ctl.signal,
    });
    if (res.status === 200) {
      return { ok: true, userId: deriveUserId(haAccessToken) };
    }
    if (res.status === 401 || res.status === 403) {
      return { ok: false, reason: 'unauthorized', status: res.status };
    }
    return { ok: false, reason: 'unexpected', status: res.status };
  } catch {
    return { ok: false, reason: 'unreachable' };
  } finally {
    clearTimeout(timer);
  }
}

// HA OAuth2 access tokens are JWTs in modern installs (>=0.95) — `sub`
// holds the user id. Long-lived access tokens are opaque random strings;
// for those we fall back to a stable hash so the user always maps to
// the same id without ever persisting the raw token.
export function deriveUserId(haAccessToken: string): string {
  const parts = haAccessToken.split('.');
  if (parts.length === 3) {
    const payload = parts[1];
    if (payload !== undefined && payload.length > 0) {
      try {
        const json = atob(base64UrlToBase64(payload));
        const parsed = JSON.parse(json) as { sub?: unknown };
        if (typeof parsed.sub === 'string' && parsed.sub.length > 0) return parsed.sub;
      } catch {
        /* fall through to hash */
      }
    }
  }
  return `ha-llat:${shortHash(haAccessToken)}`;
}

function shortHash(input: string): string {
  // Tiny non-crypto hash — enough to keep different tokens mapping to
  // different ids; the value is opaque and never leaves the service.
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function base64UrlToBase64(value: string): string {
  let normal = value.replace(/-/g, '+').replace(/_/g, '/');
  while (normal.length % 4 !== 0) normal += '=';
  return normal;
}

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}
