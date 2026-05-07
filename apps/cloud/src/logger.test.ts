import { describe, expect, it } from 'vitest';

import { createLogger, scrub } from './logger';

describe('scrub — PII redaction', () => {
  it('redacts sensitive keys at the top level', () => {
    expect(scrub({ access_token: 'abc', user: 'glaon' })).toEqual({
      access_token: '[REDACTED]',
      user: 'glaon',
    });
  });

  it('redacts sensitive keys recursively', () => {
    const input = {
      request: {
        method: 'POST',
        headers: { authorization: 'Bearer xyz', accept: 'application/json' },
      },
    };
    expect(scrub(input)).toEqual({
      request: {
        method: 'POST',
        headers: { authorization: '[REDACTED]', accept: 'application/json' },
      },
    });
  });

  it('redacts sensitive keys inside arrays', () => {
    const input = { events: [{ pair_code: '123456', ts: 1 }] };
    expect(scrub(input)).toEqual({ events: [{ pair_code: '[REDACTED]', ts: 1 }] });
  });

  it('matches keys case-insensitively', () => {
    expect(scrub({ Authorization: 'Bearer xyz' })).toEqual({ Authorization: '[REDACTED]' });
  });

  it('leaves non-sensitive primitives alone', () => {
    expect(scrub('hello')).toBe('hello');
    expect(scrub(42)).toBe(42);
    expect(scrub(null)).toBeNull();
  });
});

describe('createLogger', () => {
  it('emits JSON lines containing level + time + record fields', () => {
    const lines: string[] = [];
    const logger = createLogger({ level: 'debug', write: (line) => lines.push(line) });

    logger.info({ msg: 'hello', method: 'GET' });

    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0] ?? '{}') as Record<string, unknown>;
    expect(parsed.level).toBe('info');
    expect(parsed.msg).toBe('hello');
    expect(parsed.method).toBe('GET');
    expect(parsed.time).toBeTruthy();
  });

  it('drops records below the configured level', () => {
    const lines: string[] = [];
    const logger = createLogger({ level: 'warn', write: (line) => lines.push(line) });

    logger.debug({ msg: 'noise' });
    logger.info({ msg: 'noise' });
    logger.warn({ msg: 'visible' });
    logger.error({ msg: 'visible' });

    expect(lines).toHaveLength(2);
  });

  it('runs records through the PII scrubber before writing', () => {
    const lines: string[] = [];
    const logger = createLogger({ level: 'debug', write: (line) => lines.push(line) });

    logger.info({ msg: 'hi', access_token: 'abc' });

    const parsed = JSON.parse(lines[0] ?? '{}') as Record<string, unknown>;
    expect(parsed.access_token).toBe('[REDACTED]');
    expect(parsed.msg).toBe('hi');
  });
});
