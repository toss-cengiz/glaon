// Agent state machine — the supervisor loop transitions between IDLE (no
// credentials), CONNECTING (dialing cloud + HA), RUNNING (bridge live),
// BACKOFF (transient error), FATAL (auth rejected, wait for re-pair).
//
// The /pair/claim handler writes new options + flips a "paired" event so the
// supervisor wakes from IDLE / FATAL and reconnects with the new credentials
// without spawning a new process.

export type AgentStateName = 'idle' | 'connecting' | 'running' | 'backoff' | 'fatal';

export interface AgentStateView {
  readonly name: AgentStateName;
  readonly homeId: string | null;
  readonly lastError: string | null;
  readonly attempt: number;
}

type Listener = () => void;

export class AgentState {
  private state: AgentStateView = {
    name: 'idle',
    homeId: null,
    lastError: null,
    attempt: 0,
  };
  private readonly listeners = new Set<Listener>();
  private wakeResolver: (() => void) | null = null;

  view(): AgentStateView {
    return this.state;
  }

  set(next: Partial<AgentStateView>): void {
    this.state = { ...this.state, ...next };
    for (const listener of this.listeners) listener();
  }

  on(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // The supervisor loop calls `waitForWake()` when sitting in IDLE or FATAL.
  // /pair/claim → `pairedSignal()` resolves the wait so the loop can re-read
  // options and try to connect.
  waitForWake(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.wakeResolver = resolve;
    });
  }

  pairedSignal(): void {
    const resolver = this.wakeResolver;
    this.wakeResolver = null;
    if (resolver !== null) resolver();
  }
}
