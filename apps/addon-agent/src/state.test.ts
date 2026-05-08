import { describe, expect, it } from 'vitest';

import { AgentState } from './state';

describe('AgentState', () => {
  it('starts in idle with null homeId', () => {
    const s = new AgentState();
    expect(s.view()).toEqual({ name: 'idle', homeId: null, lastError: null, attempt: 0 });
  });

  it('merges partial updates into the view', () => {
    const s = new AgentState();
    s.set({ name: 'connecting', homeId: 'h-1' });
    expect(s.view()).toEqual({
      name: 'connecting',
      homeId: 'h-1',
      lastError: null,
      attempt: 0,
    });
    s.set({ name: 'running' });
    expect(s.view().name).toBe('running');
    expect(s.view().homeId).toBe('h-1');
  });

  it('notifies listeners on every set', () => {
    const s = new AgentState();
    let calls = 0;
    const off = s.on(() => {
      calls++;
    });
    s.set({ name: 'connecting' });
    s.set({ attempt: 1 });
    expect(calls).toBe(2);
    off();
    s.set({ name: 'running' });
    expect(calls).toBe(2);
  });

  it('pairedSignal resolves a pending waitForWake promise', async () => {
    const s = new AgentState();
    const wake = s.waitForWake();
    let resolved = false;
    void wake.then(() => {
      resolved = true;
    });
    expect(resolved).toBe(false);
    s.pairedSignal();
    await wake;
    expect(resolved).toBe(true);
  });

  it('pairedSignal is a no-op when nobody is waiting', () => {
    const s = new AgentState();
    expect(() => {
      s.pairedSignal();
    }).not.toThrow();
  });
});
