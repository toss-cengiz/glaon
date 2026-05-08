import { describe, expect, it } from 'vitest';

import { FatalRelayAuthError, nextDelay } from './backoff';

describe('nextDelay', () => {
  it('grows exponentially up to maxDelay', () => {
    const random = () => 0.5; // jitter contribution: 0
    expect(nextDelay(1, { baseDelayMs: 100, maxDelayMs: 10_000, random })).toBe(100);
    expect(nextDelay(2, { baseDelayMs: 100, maxDelayMs: 10_000, random })).toBe(200);
    expect(nextDelay(3, { baseDelayMs: 100, maxDelayMs: 10_000, random })).toBe(400);
    expect(nextDelay(20, { baseDelayMs: 100, maxDelayMs: 10_000, random })).toBe(10_000);
  });

  it('applies +/-25% jitter from the random source', () => {
    const lowJitter = nextDelay(1, { baseDelayMs: 100, maxDelayMs: 10_000, random: () => 0 });
    const highJitter = nextDelay(1, { baseDelayMs: 100, maxDelayMs: 10_000, random: () => 1 });
    expect(lowJitter).toBeCloseTo(75, 5);
    expect(highJitter).toBeCloseTo(125, 5);
  });

  it('never returns a negative delay', () => {
    expect(nextDelay(1, { baseDelayMs: 100, random: () => 0 })).toBeGreaterThanOrEqual(0);
  });
});

describe('FatalRelayAuthError', () => {
  it('is an Error subclass with a stable name', () => {
    const err = new FatalRelayAuthError('bad secret');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('FatalRelayAuthError');
    expect(err.message).toBe('bad secret');
  });
});
