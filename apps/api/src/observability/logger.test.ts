import { describe, expect, it } from 'vitest';

import { createLogger, requestContextStore, scrub } from './logger';

function getLine(lines: readonly string[], index: number): string {
  const value = lines[index];
  if (value === undefined) throw new Error(`expected log line ${String(index)}`);
  return value;
}

function captureLogger(): { lines: string[]; logger: ReturnType<typeof createLogger> } {
  const lines: string[] = [];
  const logger = createLogger({
    level: 'debug',
    write: (line) => lines.push(line),
  });
  return { lines, logger };
}

describe('logger', () => {
  it('emits valid JSON with level + time', () => {
    const { lines, logger } = captureLogger();
    logger.info({ msg: 'hello' });
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(getLine(lines, 0)) as Record<string, unknown>;
    expect(parsed.level).toBe('info');
    expect(typeof parsed.time).toBe('string');
    expect(parsed.msg).toBe('hello');
  });

  it('respects the configured level', () => {
    const lines: string[] = [];
    const logger = createLogger({ level: 'warn', write: (line) => lines.push(line) });
    logger.debug({ msg: 'dropped' });
    logger.info({ msg: 'dropped' });
    logger.warn({ msg: 'kept' });
    logger.error({ msg: 'kept' });
    expect(lines).toHaveLength(2);
  });

  it('redacts sensitive top-level keys', () => {
    const { lines, logger } = captureLogger();
    logger.info({
      msg: 'auth attempt',
      ha_access_token: 'leaky',
      authorization: 'Bearer x',
      password: 'p',
    });
    const parsed = JSON.parse(getLine(lines, 0)) as Record<string, unknown>;
    expect(parsed.ha_access_token).toBe('[REDACTED]');
    expect(parsed.authorization).toBe('[REDACTED]');
    expect(parsed.password).toBe('[REDACTED]');
    expect(parsed.msg).toBe('auth attempt');
  });

  it('redacts sensitive keys at any nesting depth', () => {
    const { lines, logger } = captureLogger();
    logger.info({
      headers: { Cookie: 'session=x' },
      body: { user: { jwt: 'eyJ.X.Y' } },
      list: [{ session_jwt: 'a.b.c' }],
    });
    const parsed = JSON.parse(getLine(lines, 0)) as Record<string, unknown>;
    expect((parsed.headers as Record<string, string>).Cookie).toBe('[REDACTED]');
    expect((parsed.body as { user: Record<string, string> }).user.jwt).toBe('[REDACTED]');
    expect((parsed.list as { session_jwt: string }[])[0]?.session_jwt).toBe('[REDACTED]');
  });

  it('matches sensitive keys case-insensitively', () => {
    const { lines, logger } = captureLogger();
    logger.info({ Authorization: 'Bearer x', SESSION_JWT_SECRET: 's' });
    const parsed = JSON.parse(getLine(lines, 0)) as Record<string, unknown>;
    expect(parsed.Authorization).toBe('[REDACTED]');
    expect(parsed.SESSION_JWT_SECRET).toBe('[REDACTED]');
  });

  it('auto-includes the request_id from AsyncLocalStorage', () => {
    const { lines, logger } = captureLogger();
    requestContextStore.run(
      {
        requestId: 'req-42',
        method: 'GET',
        path: '/healthz',
        startedAt: Date.now(),
      },
      () => {
        logger.info({ msg: 'inside' });
      },
    );
    logger.info({ msg: 'outside' });
    const inside = JSON.parse(getLine(lines, 0)) as Record<string, unknown>;
    const outside = JSON.parse(getLine(lines, 1)) as Record<string, unknown>;
    expect(inside.request_id).toBe('req-42');
    expect(outside.request_id).toBeUndefined();
  });
});

describe('scrub', () => {
  it('returns primitives unchanged', () => {
    expect(scrub('hi')).toBe('hi');
    expect(scrub(42)).toBe(42);
    expect(scrub(null)).toBe(null);
    expect(scrub(undefined)).toBe(undefined);
  });

  it('walks arrays', () => {
    expect(scrub([{ token: 'a' }, { ok: 1 }])).toEqual([{ token: '[REDACTED]' }, { ok: 1 }]);
  });
});
