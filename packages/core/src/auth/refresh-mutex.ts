// Per-slot refresh serialization. When several callers detect an expired token at once and
// kick off refreshes concurrently, only one network round-trip should hit HA / cloud — the rest
// await the same promise. Without this, HA frequently returns 429 / refresh-token-rotation can
// invalidate an in-flight refresh.

import type { CredentialKind } from './token-store';

export class RefreshMutex {
  private readonly inFlight = new Map<CredentialKind, Promise<unknown>>();

  /**
   * Run `refresh` for the given slot. Concurrent calls for the same slot share the same
   * promise; the underlying refresh function executes exactly once until it settles.
   */
  async run<T>(slot: CredentialKind, refresh: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(slot);
    if (existing) {
      return existing as Promise<T>;
    }
    const promise = refresh().finally(() => {
      this.inFlight.delete(slot);
    });
    this.inFlight.set(slot, promise);
    return promise;
  }

  /** Test helper: number of refreshes currently in flight (across all slots). */
  get inFlightCount(): number {
    return this.inFlight.size;
  }
}
