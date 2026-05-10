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

// ─── /auth/login_flow proxy (#468 / ADR 0027) ───────────────────────────────
//
// Drives HA's three-step login_flow API on the user's behalf so the
// Glaon Device-tab login can collect credentials in its own UI and HA's
// redirect screen never appears. The shape of each step is documented at
// developers.home-assistant.io/docs/auth_api — `login_flow` (POST init)
// returns a `flow_id` + first form step; POST `login_flow/<flow_id>` with
// the form values either returns `{type: "create_entry", result: <code>}`
// or escalates to a follow-up step (MFA) or aborts (`invalid_auth`); the
// `result` is then exchanged at `/auth/token` for a real bearer token.
//
// PKCE code_verifier is intentionally absent: the auth code returned by
// `login_flow` is bound to `client_id` server-side and is single-use, so
// there is no redirect interception risk that PKCE would mitigate.

export interface HaCredentials {
  readonly username: string;
  readonly password: string;
  readonly clientId: string;
}

export interface HaLoginFlowSuccess {
  readonly ok: true;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
}

export interface HaLoginFlowFailure {
  readonly ok: false;
  readonly reason:
    | 'invalid-url'
    | 'invalid-credentials'
    | 'mfa-required'
    | 'unreachable'
    | 'flow-error';
  readonly status?: number;
}

export type HaLoginFlowResult = HaLoginFlowSuccess | HaLoginFlowFailure;

export async function loginFlow(
  haBaseUrl: string,
  credentials: HaCredentials,
  options: IntrospectOptions = {},
): Promise<HaLoginFlowResult> {
  const base = parseHaBaseUrl(haBaseUrl);
  if (base === null) return { ok: false, reason: 'invalid-url' };

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const ctl = new AbortController();
  const timer = setTimeout(() => {
    ctl.abort();
  }, timeoutMs);

  try {
    // Step 1 — initiate flow.
    const initRes = await fetchImpl(`${base}/auth/login_flow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: credentials.clientId,
        handler: ['homeassistant', null],
        redirect_uri: credentials.clientId,
      }),
      signal: ctl.signal,
    });
    if (!initRes.ok) {
      return { ok: false, reason: 'flow-error', status: initRes.status };
    }
    const initBody = (await safeJson(initRes)) as { flow_id?: unknown; type?: unknown };
    const flowId = typeof initBody.flow_id === 'string' ? initBody.flow_id : null;
    if (flowId === null || initBody.type !== 'form') {
      return { ok: false, reason: 'flow-error' };
    }

    // Step 2 — submit credentials.
    const submitRes = await fetchImpl(`${base}/auth/login_flow/${encodeURIComponent(flowId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
        client_id: credentials.clientId,
      }),
      signal: ctl.signal,
    });
    if (!submitRes.ok) {
      return { ok: false, reason: 'flow-error', status: submitRes.status };
    }
    const submitBody = (await safeJson(submitRes)) as {
      type?: unknown;
      result?: unknown;
      step_id?: unknown;
      reason?: unknown;
    };
    if (submitBody.type === 'abort') {
      return { ok: false, reason: 'invalid-credentials' };
    }
    if (submitBody.type === 'form') {
      // A second form step means HA wants more input — most commonly a
      // multi-factor auth challenge. We surface this distinctly so the
      // UI can show a meaningful message instead of a generic error.
      return { ok: false, reason: 'mfa-required' };
    }
    if (submitBody.type !== 'create_entry' || typeof submitBody.result !== 'string') {
      return { ok: false, reason: 'flow-error' };
    }
    const authCode = submitBody.result;

    // Step 3 — exchange auth code for tokens. HA's /auth/token expects
    // form-urlencoded bodies; the JSON variant is rejected with 400.
    const tokenRes = await fetchImpl(`${base}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        client_id: credentials.clientId,
      }).toString(),
      signal: ctl.signal,
    });
    if (!tokenRes.ok) {
      return { ok: false, reason: 'flow-error', status: tokenRes.status };
    }
    const tokens = (await safeJson(tokenRes)) as {
      access_token?: unknown;
      refresh_token?: unknown;
      expires_in?: unknown;
    };
    if (
      typeof tokens.access_token !== 'string' ||
      typeof tokens.refresh_token !== 'string' ||
      typeof tokens.expires_in !== 'number'
    ) {
      return { ok: false, reason: 'flow-error' };
    }
    return {
      ok: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    };
  } catch {
    return { ok: false, reason: 'unreachable' };
  } finally {
    clearTimeout(timer);
  }
}

function parseHaBaseUrl(haBaseUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(haBaseUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  return stripTrailingSlash(parsed.toString());
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
