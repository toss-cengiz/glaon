// Entity state store — see ADR 0015 (state management) and issue #11.
//
// Holds the live mirror of HA's entity tree (`entity_id` → `EntityRecord`). HaClient
// (#10) feeds `applySnapshot` after each successful (re)connect and `applyDelta` for
// every `state_changed` event in between. UI consumers subscribe via `subscribe()` and
// pull through pure selectors (`selectEntity`, `selectEntitiesByDomain`,
// `selectEntitiesByArea`) — there is no `useStore`/`useEntity` hook in `@glaon/core`
// because the package stays platform-agnostic per ADR 0004; React + RN bindings live
// in `apps/*/src/state/*` and call `subscribe()` + selectors there.
//
// The implementation is a minimal vanilla observable. ADR 0015 picks Zustand + Immer
// as the eventual home; the contract here (`getState`, `subscribe`, `applySnapshot`,
// `applyDelta`) maps 1:1 to a Zustand vanilla store, so the migration to Zustand is
// a follow-up internal swap rather than a breaking change for callers.

import type { HaEntityState } from '../types';
import type { HaStateChangedEvent } from '../ha/protocol/messages';

/**
 * Live-state record for a single HA entity.
 *
 * `staleSince` is set when the cloud relay surfaces a `home_offline` control frame
 * (ADR 0018 risk C2) — the home is unreachable but the last-known state is still
 * useful in the UI. It clears on the next successful snapshot.
 */
export interface EntityRecord extends HaEntityState {
  readonly staleSince: number | null;
}

export type EntityStoreSnapshot = ReadonlyMap<string, EntityRecord>;

export class EntityStore {
  private snapshot: EntityStoreSnapshot = new Map();
  private readonly listeners = new Set<() => void>();

  getState(): EntityStoreSnapshot {
    return this.snapshot;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Replace the entire entity tree with a freshly fetched snapshot. Reconnect path:
   * HaClient calls this from its `onSnapshot` hook after `get_states` round-trips.
   */
  applySnapshot(states: readonly HaEntityState[]): void {
    const next = new Map<string, EntityRecord>();
    for (const state of states) {
      next.set(state.entity_id, { ...state, staleSince: null });
    }
    this.snapshot = next;
    this.notify();
  }

  /**
   * Apply a single `state_changed` event. Adds, replaces, or removes the entity in
   * place. `staleSince` clears on every delta — a fresh state from HA implies the
   * home is reachable.
   */
  applyDelta(event: HaStateChangedEvent): void {
    const { entity_id, new_state } = event.data;
    const next = new Map(this.snapshot);
    if (new_state === null) {
      if (!next.has(entity_id)) return;
      next.delete(entity_id);
    } else {
      next.set(entity_id, { ...new_state, staleSince: null });
    }
    this.snapshot = next;
    this.notify();
  }

  /**
   * Mark every entity as stale as of `asOf`. Used when the cloud relay reports
   * `home_offline` — UI keeps the last-known values but can render a banner.
   */
  markStale(asOf: number): void {
    let mutated = false;
    const next = new Map<string, EntityRecord>();
    for (const [id, record] of this.snapshot) {
      if (record.staleSince === asOf) {
        next.set(id, record);
        continue;
      }
      next.set(id, { ...record, staleSince: asOf });
      mutated = true;
    }
    if (!mutated) return;
    this.snapshot = next;
    this.notify();
  }

  /** Clear staleness across the tree. Called after a successful snapshot. */
  clearStale(): void {
    let mutated = false;
    const next = new Map<string, EntityRecord>();
    for (const [id, record] of this.snapshot) {
      if (record.staleSince === null) {
        next.set(id, record);
        continue;
      }
      next.set(id, { ...record, staleSince: null });
      mutated = true;
    }
    if (!mutated) return;
    this.snapshot = next;
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}

/* ---------- selectors (pure) ---------- */

export function selectEntity(
  state: EntityStoreSnapshot,
  entityId: string,
): EntityRecord | undefined {
  return state.get(entityId);
}

export function selectEntitiesByDomain(
  state: EntityStoreSnapshot,
  domain: string,
): readonly EntityRecord[] {
  const prefix = `${domain}.`;
  const result: EntityRecord[] = [];
  for (const [id, record] of state) {
    if (id.startsWith(prefix)) result.push(record);
  }
  return result;
}

export function selectEntitiesByArea(
  state: EntityStoreSnapshot,
  areaId: string,
): readonly EntityRecord[] {
  const result: EntityRecord[] = [];
  for (const record of state.values()) {
    if (record.attributes.area_id === areaId) result.push(record);
  }
  return result;
}
