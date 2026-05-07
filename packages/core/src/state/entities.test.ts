import { describe, expect, it, vi } from 'vitest';

import type { HaEntityState } from '../types';
import type { HaStateChangedEvent } from '../ha/protocol/messages';

import {
  EntityStore,
  selectEntitiesByArea,
  selectEntitiesByDomain,
  selectEntity,
} from './entities';

function light(entity_id: string, state: string, area_id?: string): HaEntityState {
  return {
    entity_id,
    state,
    attributes: area_id !== undefined ? { area_id } : {},
    last_changed: '2026-05-07T20:00:00Z',
    last_updated: '2026-05-07T20:00:00Z',
  };
}

function stateChanged(
  entity_id: string,
  newState: HaEntityState | null,
  oldState: HaEntityState | null = null,
): HaStateChangedEvent {
  return {
    event_type: 'state_changed',
    data: { entity_id, old_state: oldState, new_state: newState },
    origin: 'LOCAL',
    time_fired: '2026-05-07T20:00:00Z',
  };
}

describe('EntityStore.applySnapshot', () => {
  it('seeds the store with the snapshot and clears any previous state', () => {
    const store = new EntityStore();
    store.applySnapshot([light('light.kitchen', 'on')]);
    expect(store.getState().size).toBe(1);

    store.applySnapshot([light('light.living', 'off')]);
    expect(store.getState().size).toBe(1);
    expect(store.getState().get('light.living')?.state).toBe('off');
    expect(store.getState().has('light.kitchen')).toBe(false);
  });

  it('marks every record as fresh (staleSince=null) on snapshot', () => {
    const store = new EntityStore();
    store.applySnapshot([light('light.kitchen', 'on')]);
    store.markStale(1_700_000_000_000);
    expect(store.getState().get('light.kitchen')?.staleSince).toBe(1_700_000_000_000);

    store.applySnapshot([light('light.kitchen', 'on')]);
    expect(store.getState().get('light.kitchen')?.staleSince).toBeNull();
  });
});

describe('EntityStore.applyDelta', () => {
  it('inserts a new entity when none existed', () => {
    const store = new EntityStore();
    store.applyDelta(stateChanged('light.kitchen', light('light.kitchen', 'on')));
    expect(store.getState().get('light.kitchen')?.state).toBe('on');
  });

  it('updates an existing entity in place', () => {
    const store = new EntityStore();
    store.applySnapshot([light('light.kitchen', 'off')]);
    store.applyDelta(stateChanged('light.kitchen', light('light.kitchen', 'on')));
    expect(store.getState().get('light.kitchen')?.state).toBe('on');
  });

  it('removes an entity when new_state is null', () => {
    const store = new EntityStore();
    store.applySnapshot([light('light.kitchen', 'on')]);
    store.applyDelta(stateChanged('light.kitchen', null));
    expect(store.getState().has('light.kitchen')).toBe(false);
  });

  it('clears staleSince after a fresh delta', () => {
    const store = new EntityStore();
    store.applySnapshot([light('light.kitchen', 'on')]);
    store.markStale(1_700_000_000_000);
    store.applyDelta(stateChanged('light.kitchen', light('light.kitchen', 'on')));
    expect(store.getState().get('light.kitchen')?.staleSince).toBeNull();
  });
});

describe('EntityStore.markStale / clearStale', () => {
  it('marks all entities with the given timestamp', () => {
    const store = new EntityStore();
    store.applySnapshot([light('light.a', 'on'), light('light.b', 'off')]);
    store.markStale(42);
    expect(store.getState().get('light.a')?.staleSince).toBe(42);
    expect(store.getState().get('light.b')?.staleSince).toBe(42);
  });

  it('does not notify listeners when nothing changes', () => {
    const store = new EntityStore();
    store.applySnapshot([light('light.a', 'on')]);
    store.markStale(42);
    const listener = vi.fn();
    store.subscribe(listener);
    store.markStale(42);
    expect(listener).not.toHaveBeenCalled();
  });

  it('clearStale resets every staleSince to null', () => {
    const store = new EntityStore();
    store.applySnapshot([light('light.a', 'on')]);
    store.markStale(99);
    store.clearStale();
    expect(store.getState().get('light.a')?.staleSince).toBeNull();
  });
});

describe('EntityStore.subscribe', () => {
  it('notifies listeners on every state mutation', () => {
    const store = new EntityStore();
    const listener = vi.fn();
    const unsub = store.subscribe(listener);

    store.applySnapshot([light('light.a', 'on')]);
    store.applyDelta(stateChanged('light.a', light('light.a', 'off')));

    expect(listener).toHaveBeenCalledTimes(2);
    unsub();
    store.applyDelta(stateChanged('light.a', light('light.a', 'on')));
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe('selectors', () => {
  const store = new EntityStore();
  store.applySnapshot([
    light('light.kitchen', 'on', 'kitchen'),
    light('light.living', 'off', 'living'),
    light('switch.fan', 'off', 'kitchen'),
  ]);

  it('selectEntity returns the record for the id', () => {
    expect(selectEntity(store.getState(), 'light.kitchen')?.state).toBe('on');
  });

  it('selectEntitiesByDomain filters by entity_id prefix', () => {
    const result = selectEntitiesByDomain(store.getState(), 'light');
    expect(result.map((r) => r.entity_id).sort()).toEqual(['light.kitchen', 'light.living']);
  });

  it('selectEntitiesByArea filters by attributes.area_id', () => {
    const result = selectEntitiesByArea(store.getState(), 'kitchen');
    expect(result.map((r) => r.entity_id).sort()).toEqual(['light.kitchen', 'switch.fan']);
  });
});
