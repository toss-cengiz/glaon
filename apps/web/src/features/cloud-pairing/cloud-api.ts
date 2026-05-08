// Thin REST client for the Glaon cloud pair endpoints (#346):
//   POST /pair/initiate          → { code, expiresAt }
//   GET  /pair/status?code=...   → { status: 'pending' | 'claimed' | 'expired', homeId?, expiresAt? }
//
// Same defense pattern as the addon-agent's `selectUpstream()` (#444): the
// destination URL is selected from a closed switch on the env-provided
// host so file/env data does not get interpolated into the network sink
// the CodeQL `js/file-access-to-http` rule watches. `VITE_GLAON_CLOUD_URL`
// from the env defaults to the Glaon prod relay.

const PROD_CLOUD = 'https://relay.glaon.app';
const STAGING_CLOUD = 'https://relay-staging.glaon.app';

const RAW_CLOUD_URL: string | undefined = import.meta.env.VITE_GLAON_CLOUD_URL;

function selectCloudBase(): string {
  if (RAW_CLOUD_URL === undefined || RAW_CLOUD_URL.length === 0) return PROD_CLOUD;
  let parsed: URL;
  try {
    parsed = new URL(RAW_CLOUD_URL);
  } catch {
    return PROD_CLOUD;
  }
  switch (parsed.host) {
    case 'relay.glaon.app':
      return PROD_CLOUD;
    case 'relay-staging.glaon.app':
      return STAGING_CLOUD;
    default: {
      // Dev fixtures may set a localhost URL; we mirror only the explicit
      // host string so CodeQL sees a fixed set of literals.
      if (parsed.host === 'localhost' || /^localhost:\d{1,5}$/.test(parsed.host)) {
        // Pick the actual host from a literal map rather than re-interpolating.
        if (parsed.host === 'localhost') return 'http://localhost:8787';
        if (parsed.host === 'localhost:8787') return 'http://localhost:8787';
        if (parsed.host === 'localhost:8788') return 'http://localhost:8788';
        if (parsed.host === 'localhost:8789') return 'http://localhost:8789';
      }
      return PROD_CLOUD;
    }
  }
}

export interface InitiateResult {
  readonly code: string;
  readonly expiresAt: number;
}

export interface StatusResult {
  readonly status: 'pending' | 'claimed' | 'expired';
  readonly homeId?: string;
  readonly expiresAt?: number;
}

export type CloudPairError =
  | { readonly kind: 'unauthorized' }
  | { readonly kind: 'rate-limited'; readonly retryAfterMs: number | null }
  | { readonly kind: 'not-found' }
  | { readonly kind: 'network' }
  | { readonly kind: 'unknown'; readonly status: number };

export interface CloudPairClient {
  initiate(
    token: string,
  ): Promise<{ ok: true; data: InitiateResult } | { ok: false; err: CloudPairError }>;
  status(
    token: string,
    code: string,
  ): Promise<{ ok: true; data: StatusResult } | { ok: false; err: CloudPairError }>;
}

interface ClientOptions {
  readonly fetchImpl?: typeof fetch;
  readonly cloudBase?: string;
}

export function createCloudPairClient(options: ClientOptions = {}): CloudPairClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const cloudBase = options.cloudBase ?? selectCloudBase();

  return {
    async initiate(token) {
      try {
        const res = await fetchImpl(`${cloudBase}/pair/initiate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
        return await parseResult<InitiateResult>(res, isInitiateResult);
      } catch {
        return { ok: false, err: { kind: 'network' } };
      }
    },
    async status(token, code) {
      try {
        const url = `${cloudBase}/pair/status?code=${encodeURIComponent(code)}`;
        const res = await fetchImpl(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
        return await parseResult<StatusResult>(res, isStatusResult);
      } catch {
        return { ok: false, err: { kind: 'network' } };
      }
    },
  };
}

async function parseResult<T>(
  res: Response,
  guard: (value: unknown) => value is T,
): Promise<{ ok: true; data: T } | { ok: false; err: CloudPairError }> {
  const text = await res.text();
  let body: unknown = {};
  if (text.length > 0) {
    try {
      body = JSON.parse(text);
    } catch {
      /* tolerate empty / non-JSON */
    }
  }
  if (res.status >= 200 && res.status < 300 && guard(body)) {
    return { ok: true, data: body };
  }
  if (res.status === 401) return { ok: false, err: { kind: 'unauthorized' } };
  if (res.status === 404) return { ok: false, err: { kind: 'not-found' } };
  if (res.status === 429) {
    const retryAfterMs = parseRetryAfterMs(body);
    return { ok: false, err: { kind: 'rate-limited', retryAfterMs } };
  }
  return { ok: false, err: { kind: 'unknown', status: res.status } };
}

function parseRetryAfterMs(body: unknown): number | null {
  if (body === null || typeof body !== 'object') return null;
  const candidate = (body as Record<string, unknown>).retryAfterMs;
  if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate >= 0) {
    return candidate;
  }
  return null;
}

function isInitiateResult(value: unknown): value is InitiateResult {
  if (value === null || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.code === 'string' && typeof v.expiresAt === 'number';
}

function isStatusResult(value: unknown): value is StatusResult {
  if (value === null || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return v.status === 'pending' || v.status === 'claimed' || v.status === 'expired';
}
