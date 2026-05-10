// Structured JSON logger for apps/api per ADR 0007 + #423. Same shape
// as `apps/cloud/src/logger.ts` so a future shared `@glaon/core/log`
// can subsume both — the duplication is intentional during Phase 2 to
// keep stack-specific logging primitives (CF Workers vs Node) loose.
//
// Output is a single JSON line per emit. The PII scrubber redacts
// values whose key matches the sensitive set (case-insensitive); the
// per-request id from AsyncLocalStorage is auto-merged when set.

import { AsyncLocalStorage } from 'node:async_hooks';

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
  'session_jwt',
  'session_jwt_secret',
  'pair_code',
  'pair_secret',
  'relay_secret',
  'sentry_dsn',
  'mongodb_uri',
  'ha_access_token',
]);

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function isLogLevel(value: string): value is LogLevel {
  return value === 'debug' || value === 'info' || value === 'warn' || value === 'error';
}

export interface RequestContext {
  readonly requestId: string;
  readonly method: string;
  readonly path: string;
  readonly startedAt: number;
}

export const requestContextStore = new AsyncLocalStorage<RequestContext>();

export interface Logger {
  debug(record: Record<string, unknown>): void;
  info(record: Record<string, unknown>): void;
  warn(record: Record<string, unknown>): void;
  error(record: Record<string, unknown>): void;
}

interface LoggerOptions {
  readonly level: string;
  readonly write?: (line: string) => void;
}

const defaultWrite = (line: string): void => {
  process.stdout.write(`${line}\n`);
};

export function createLogger(options: LoggerOptions): Logger {
  const minLevel = isLogLevel(options.level) ? LEVEL_ORDER[options.level] : LEVEL_ORDER.info;
  const write = options.write ?? defaultWrite;

  function emit(level: LogLevel, record: Record<string, unknown>): void {
    if (LEVEL_ORDER[level] < minLevel) return;
    const scrubbed = scrubRecord(record);
    const ctx = requestContextStore.getStore();
    const envelope: Record<string, unknown> = {
      level,
      time: new Date().toISOString(),
      ...scrubbed,
    };
    if (ctx !== undefined) {
      envelope.request_id = ctx.requestId;
    }
    write(JSON.stringify(envelope));
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
 * Recursively scrub values; keys matching the sensitive set are
 * replaced with `[REDACTED]`. Arrays + nested objects walked.
 * Exported for the unit suite.
 */
export function scrub(input: unknown): unknown {
  if (input === null || typeof input !== 'object') return input;
  if (Array.isArray(input)) return input.map(scrub);
  return scrubRecord(input as Record<string, unknown>);
}
