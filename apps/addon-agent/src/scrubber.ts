// Log scrubber — HA OAuth tokens, Clerk session JWTs, and relay_secret never
// land in agent logs. The agent never parses the HA WS payload it forwards;
// the scrubber covers structured log entries the agent emits about its own
// lifecycle (connect, disconnect, errors).
//
// Two layers (#351):
//
//   1. Key-name match (case-insensitive) against `SENSITIVE_KEYS`. Catches
//      the structured paths where a leak is most likely (e.g. an error
//      surface that JSON-stringifies a request whose `headers` member
//      includes Authorization).
//   2. Value pattern match for cases where a secret slips through as a
//      free-form string — e.g. `err.message: 'failed: Bearer abc...'`. The
//      patterns are conservative (Bearer prefix, three-segment JWT) to keep
//      the false-positive rate low.

const SENSITIVE_KEYS = new Set([
  'access_token',
  'refresh_token',
  'authorization',
  'cookie',
  'set-cookie',
  'password',
  'secret',
  'token',
  'jwt',
  'session',
  'relay_secret',
  'supervisor_token',
]);

// `Bearer <token>` — case-insensitive scheme, token is anything but
// whitespace. The replacement keeps the scheme so log readers can still
// tell what was redacted.
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;

// JWT shape: three base64url-ish segments separated by dots. Min ~6 chars
// per segment so we don't match innocent dotted identifiers.
const JWT_PATTERN = /\b[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\b/g;

export function scrub(input: unknown): unknown {
  if (input === null) return input;
  if (typeof input === 'string') return redactString(input);
  if (typeof input !== 'object') return input;
  if (Array.isArray(input)) return input.map(scrub);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      out[key] = '[REDACTED]';
      continue;
    }
    out[key] = scrub(value);
  }
  return out;
}

function redactString(value: string): string {
  let result = value.replace(BEARER_PATTERN, 'Bearer [REDACTED]');
  result = result.replace(JWT_PATTERN, '[REDACTED-JWT]');
  return result;
}
