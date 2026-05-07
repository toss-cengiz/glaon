// Log scrubber — HA OAuth tokens, Clerk session JWTs, and relay_secret never
// land in agent logs. The agent never parses the HA WS payload it forwards;
// the scrubber covers structured log entries the agent emits about its own
// lifecycle (connect, disconnect, errors).

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

export function scrub(input: unknown): unknown {
  if (input === null || typeof input !== 'object') return input;
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
