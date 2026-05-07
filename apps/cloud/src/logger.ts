// Structured JSON logger with a built-in PII scrubber. Per ADR 0018 risk C14, HA WS
// frame payloads, OAuth tokens, and Clerk session JWTs MUST never leak into log
// output. This module is the single chokepoint that inbound log calls flow through.
//
// CF Workers do not ship pino / winston — both bundle Node-only APIs. A minimal
// JSON-line logger keeps the worker bundle small and the scrubber inline.

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
  'pair_code',
  'pair_secret',
  'relay_secret',
  'sentry_dsn',
]);

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function isLogLevel(value: string): value is LogLevel {
  return value === 'debug' || value === 'info' || value === 'warn' || value === 'error';
}

interface Logger {
  debug(record: Record<string, unknown>): void;
  info(record: Record<string, unknown>): void;
  warn(record: Record<string, unknown>): void;
  error(record: Record<string, unknown>): void;
}

interface LoggerOptions {
  readonly level: string;
  /** Test injection — defaults to `globalThis.console.log`. */
  readonly write?: ((line: string) => void) | undefined;
}

// The worker logger writes structured JSON to stdout/console.log, which is exactly what
// CF Workers' `wrangler tail` / Logpush forward. Disabling no-console here is the
// intentional sink — every other module routes through this logger.
/* eslint-disable no-console */
const defaultWrite = (line: string): void => {
  console.log(line);
};
/* eslint-enable no-console */

export function createLogger(options: LoggerOptions): Logger {
  const minLevel = isLogLevel(options.level) ? LEVEL_ORDER[options.level] : LEVEL_ORDER.info;
  const { write = defaultWrite } = options;

  function emit(level: LogLevel, record: Record<string, unknown>): void {
    if (LEVEL_ORDER[level] < minLevel) return;
    const scrubbed = scrubRecord(record);
    write(JSON.stringify({ level, time: new Date().toISOString(), ...scrubbed }));
  }

  return {
    debug: (r) => {
      emit('debug', r);
    },
    info: (r) => {
      emit('info', r);
    },
    warn: (r) => {
      emit('warn', r);
    },
    error: (r) => {
      emit('error', r);
    },
  };
}

function scrubRecord(input: Record<string, unknown>): Record<string, unknown> {
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

/**
 * Recursively replace values whose key matches the sensitive set with `[REDACTED]`.
 * Keys are matched case-insensitively. Arrays + nested objects walked.
 *
 * Exported for the unit suite; production code goes through `createLogger`.
 */
export function scrub(input: unknown): unknown {
  if (input === null || typeof input !== 'object') return input;
  if (Array.isArray(input)) return input.map(scrub);
  return scrubRecord(input as Record<string, unknown>);
}
