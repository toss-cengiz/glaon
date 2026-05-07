// Exponential backoff + jitter. Same shape as ADR 0016 reconnect math:
// baseDelay * 2^attempt, capped at maxDelay, ±25% jitter. The agent uses this
// for both legs (cloud upstream, HA local) so reconnect storms cluster softly.

interface BackoffOptions {
  readonly baseDelayMs?: number;
  readonly maxDelayMs?: number;
  readonly random?: () => number;
}

export function nextDelay(attempt: number, options: BackoffOptions = {}): number {
  const baseDelay = options.baseDelayMs ?? 500;
  const maxDelay = options.maxDelayMs ?? 30_000;
  const random = options.random ?? Math.random;
  const exponential = Math.min(baseDelay * 2 ** Math.max(0, attempt - 1), maxDelay);
  const jitter = exponential * 0.25 * (random() * 2 - 1);
  return Math.max(0, exponential + jitter);
}

/**
 * Some failures (HTTP 401 from cloud — bad relay_secret) must NOT retry-storm.
 * The agent surfaces them via this sentinel and stops the reconnect loop until
 * the operator pairs again.
 */
export class FatalRelayAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FatalRelayAuthError';
  }
}
