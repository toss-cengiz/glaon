import type {
  BeforeSendFunction,
  ObservabilityBreadcrumb,
  ObservabilityEvent,
  ObservabilityRequest,
} from './types';

export const REDACTED = '[Filtered]';

export const SENSITIVE_URL_PARAMS: readonly string[] = [
  'access_token',
  'refresh_token',
  'id_token',
  'token',
  'code',
  'state',
  'client_secret',
  'api_key',
];

export const SENSITIVE_HEADER_NAMES: readonly string[] = [
  'authorization',
  'cookie',
  'set-cookie',
  'x-auth-token',
  'x-hasura-admin-secret',
];

export const SENSITIVE_KEY_SUBSTRINGS: readonly string[] = [
  'access_token',
  'refresh_token',
  'id_token',
  'bearer',
  'password',
  'secret',
  'api_key',
  'client_secret',
  'authorization',
];

const MAX_SCRUB_DEPTH = 8;

export function scrubUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  for (const param of SENSITIVE_URL_PARAMS) {
    if (parsed.searchParams.has(param)) {
      parsed.searchParams.set(param, REDACTED);
    }
  }
  return parsed.toString();
}

export function scrubQueryString(query: string): string {
  const params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query);
  for (const param of SENSITIVE_URL_PARAMS) {
    if (params.has(param)) {
      params.set(param, REDACTED);
    }
  }
  return params.toString();
}

export function scrubHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADER_NAMES.includes(key.toLowerCase())) {
      result[key] = REDACTED;
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function scrubRecursive(input: unknown, depth = 0): unknown {
  if (depth >= MAX_SCRUB_DEPTH) return input;
  if (input === null || typeof input !== 'object') return input;
  if (Array.isArray(input)) {
    return input.map((item) => scrubRecursive(item, depth + 1));
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const keyLower = key.toLowerCase();
    if (SENSITIVE_KEY_SUBSTRINGS.some((s) => keyLower.includes(s))) {
      result[key] = REDACTED;
    } else if (keyLower === 'url' && typeof value === 'string') {
      result[key] = scrubUrl(value);
    } else if (keyLower === 'query_string' && typeof value === 'string') {
      result[key] = scrubQueryString(value);
    } else {
      result[key] = scrubRecursive(value, depth + 1);
    }
  }
  return result;
}

function scrubRequest(request: ObservabilityRequest): ObservabilityRequest {
  const result: ObservabilityRequest = { ...request };
  if (typeof result.url === 'string') {
    result.url = scrubUrl(result.url);
  }
  if (typeof result.query_string === 'string') {
    result.query_string = scrubQueryString(result.query_string);
  }
  if (result.headers) {
    result.headers = scrubHeaders(result.headers);
  }
  if (result.cookies !== undefined) {
    result.cookies = REDACTED;
  }
  if (result.data !== undefined) {
    result.data = scrubRecursive(result.data);
  }
  return result;
}

function scrubBreadcrumb(breadcrumb: ObservabilityBreadcrumb): ObservabilityBreadcrumb {
  const result: ObservabilityBreadcrumb = { ...breadcrumb };
  if (result.data) {
    result.data = scrubRecursive(result.data) as Record<string, unknown>;
  }
  // breadcrumb.message is free-text; URLs in breadcrumbs live under breadcrumb.data.url
  // where scrubRecursive picks them up via the url-key convention.
  return result;
}

export function scrubEvent<T extends ObservabilityEvent>(event: T): T {
  const scrubbed: T = { ...event };
  if (scrubbed.request) {
    scrubbed.request = scrubRequest(scrubbed.request);
  }
  if (scrubbed.extra) {
    scrubbed.extra = scrubRecursive(scrubbed.extra) as Record<string, unknown>;
  }
  if (scrubbed.contexts) {
    scrubbed.contexts = scrubRecursive(scrubbed.contexts) as Record<string, unknown>;
  }
  if (scrubbed.tags) {
    scrubbed.tags = scrubRecursive(scrubbed.tags) as Record<string, unknown>;
  }
  if (scrubbed.breadcrumbs) {
    scrubbed.breadcrumbs = scrubbed.breadcrumbs.map(scrubBreadcrumb);
  }
  return scrubbed;
}

export function buildBeforeSend<
  T extends ObservabilityEvent = ObservabilityEvent,
>(): BeforeSendFunction<T> {
  return (event: T) => scrubEvent(event);
}
