import { describe, expect, it, vi } from 'vitest';

import { FakeTransport } from './testing/fake-transport';
import {
  HaClient,
  HaConnectionLostError,
  HaServiceError,
  type ConnectionState,
  type HaClientOptions,
} from './client';

interface Harness {
  readonly transport: FakeTransport;
  readonly client: HaClient;
  readonly states: ConnectionState[];
}

function makeHarness(options: Partial<HaClientOptions> = {}): Harness {
  return buildClient(new FakeTransport(), options);
}

function buildClient(
  transport: FakeTransport,
  optionOverrides: Partial<HaClientOptions> = {},
): Harness {
  const states: ConnectionState[] = [];
  const client = new HaClient(() => transport, {
    getAccessToken: () => Promise.resolve('access-1'),
    onConnectionState: (state) => {
      states.push(state);
    },
    heartbeatIntervalMs: 0, // disable in unit tests; covered separately
    random: () => 0, // pin jitter to zero
    reconnectBaseDelayMs: 1,
    reconnectMaxDelayMs: 1,
    ...optionOverrides,
  });
  return { transport, client, states };
}

async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 16; i++) {
    await Promise.resolve();
  }
}

async function completeAuth(transport: FakeTransport): Promise<void> {
  // Drive the auth handshake: HA sends auth_required → client sends auth → HA sends auth_ok.
  await flushMicrotasks();
  transport.push({ type: 'auth_required', ha_version: '2025.5.0' });
  await flushMicrotasks();
  transport.push({ type: 'auth_ok', ha_version: '2025.5.0' });
}

describe('HaClient.connect — auth handshake', () => {
  it('sends auth with the access token after auth_required and reaches open', async () => {
    const { transport, client, states } = makeHarness();
    const connectPromise = client.connect();
    await completeAuth(transport);
    await connectPromise;

    expect(transport.sent).toHaveLength(1);
    expect(transport.sent[0]).toEqual({ type: 'auth', access_token: 'access-1' });
    expect(client.state).toBe('open');
    expect(states).toContain('connecting');
    expect(states).toContain('open');
  });

  it('refreshes the token once on auth_invalid then re-sends auth', async () => {
    const transport = new FakeTransport();
    const refresh = vi.fn().mockResolvedValue('access-2');
    const { client } = buildClient(transport, { refreshAccessToken: refresh });

    const connectPromise = client.connect();
    await flushMicrotasks();
    transport.push({ type: 'auth_required', ha_version: '2025.5.0' });
    await flushMicrotasks();
    transport.push({ type: 'auth_invalid', message: 'expired' });
    await flushMicrotasks();
    transport.push({ type: 'auth_ok', ha_version: '2025.5.0' });
    await connectPromise;

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(transport.sent).toEqual([
      { type: 'auth', access_token: 'access-1' },
      { type: 'auth', access_token: 'access-2' },
    ]);
    expect(client.state).toBe('open');
  });

  it('rejects connect when HA returns auth_invalid twice', async () => {
    const transport = new FakeTransport();
    const refresh = vi.fn().mockResolvedValue('access-2');
    const { client } = buildClient(transport, { refreshAccessToken: refresh });

    const connectPromise = client.connect();
    await flushMicrotasks();
    transport.push({ type: 'auth_required', ha_version: '2025.5.0' });
    await flushMicrotasks();
    transport.push({ type: 'auth_invalid', message: 'still bad' });
    await flushMicrotasks();
    transport.push({ type: 'auth_invalid', message: 'still bad' });

    await expect(connectPromise).rejects.toThrow(/HA rejected auth/);
    expect(client.state).toBe('closed');
  });
});

describe('HaClient.request — id correlation', () => {
  it('resolves with the result payload when HA returns success', async () => {
    const { transport, client } = makeHarness();
    const connectPromise = client.connect();
    await completeAuth(transport);
    await connectPromise;

    const result = client.request<{ ok: true }>({ type: 'get_states' });
    // The auth handshake consumed id 1 (auth message has no id). nextId starts at 1
    // for the first request, so get_states gets id 1.
    await flushMicrotasks();
    expect(transport.sent.at(-1)).toEqual({ id: 1, type: 'get_states' });
    transport.push({ id: 1, type: 'result', success: true, result: { ok: true } });
    await expect(result).resolves.toEqual({ ok: true });
  });

  it('rejects with HaServiceError when HA returns success: false', async () => {
    const { transport, client } = makeHarness();
    const connectPromise = client.connect();
    await completeAuth(transport);
    await connectPromise;

    const result = client.request({ type: 'get_states' });
    await flushMicrotasks();
    transport.push({
      id: 1,
      type: 'result',
      success: false,
      error: { code: 'forbidden', message: 'no' },
    });
    await expect(result).rejects.toBeInstanceOf(HaServiceError);
    await expect(result).rejects.toMatchObject({ code: 'forbidden', message: 'no' });
  });

  it('rejects in-flight requests with HaConnectionLostError on remote drop', async () => {
    const { transport, client } = makeHarness({
      schedule: () => () => undefined, // no-op scheduler so reconnect never fires
    });
    const connectPromise = client.connect();
    await completeAuth(transport);
    await connectPromise;

    const result = client.request({ type: 'get_states' });
    await flushMicrotasks();
    transport.dropFromRemote();

    await expect(result).rejects.toBeInstanceOf(HaConnectionLostError);
  });
});

describe('HaClient.subscribe — multiplexing', () => {
  it('delivers events only to the subscribing callback', async () => {
    const { transport, client } = makeHarness();
    const connectPromise = client.connect();
    await completeAuth(transport);
    await connectPromise;

    const callbackA = vi.fn();
    const subA = client.subscribeStateChanges(callbackA);
    await flushMicrotasks();
    transport.push({ id: 1, type: 'result', success: true });
    await subA;

    const callbackB = vi.fn();
    const subB = client.subscribeStateChanges(callbackB);
    await flushMicrotasks();
    transport.push({ id: 2, type: 'result', success: true });
    await subB;

    transport.push({ id: 1, type: 'event', event: { tag: 'A' } });
    transport.push({ id: 2, type: 'event', event: { tag: 'B' } });

    expect(callbackA).toHaveBeenCalledWith({ tag: 'A' });
    expect(callbackA).not.toHaveBeenCalledWith({ tag: 'B' });
    expect(callbackB).toHaveBeenCalledWith({ tag: 'B' });
    expect(callbackB).not.toHaveBeenCalledWith({ tag: 'A' });
  });

  it('replays subscriptions and reconciles a snapshot after reconnect', async () => {
    const transport = new FakeTransport();
    const onSnapshot = vi.fn();
    const scheduledTasks: { fn: () => void; delay: number }[] = [];
    const { client } = buildClient(transport, {
      onSnapshot,
      schedule: (fn: () => void, delayMs: number) => {
        scheduledTasks.push({ fn, delay: delayMs });
        return (): void => undefined;
      },
    });

    const connectPromise = client.connect();
    await completeAuth(transport);
    await connectPromise;

    const callback = vi.fn();
    const subPromise = client.subscribeStateChanges(callback);
    await flushMicrotasks();
    transport.push({ id: 1, type: 'result', success: true });
    await subPromise;

    // Drop the connection — scheduler captures a single reconnect task.
    transport.dropFromRemote();
    expect(client.state).toBe('reconnecting');
    expect(scheduledTasks).toHaveLength(1);

    // Trigger the reconnect.
    const firstTask = scheduledTasks[0];
    if (firstTask === undefined) throw new Error('expected scheduled reconnect task');
    firstTask.fn();
    await flushMicrotasks();
    transport.push({ type: 'auth_required', ha_version: '2025.5.0' });
    await flushMicrotasks();
    transport.push({ type: 'auth_ok', ha_version: '2025.5.0' });
    // Replay subscription + snapshot reconciliation now run; resolve them.
    await flushMicrotasks();
    // After replay the transport has received another subscribe + a get_states.
    const replayed = transport.sent.filter(
      (f): f is Extract<typeof f, { type: 'subscribe_events' }> => f.type === 'subscribe_events',
    );
    expect(replayed.length).toBeGreaterThanOrEqual(2);

    // Resolve the replay subscribe + the snapshot fetch.
    const lastReplay = replayed[replayed.length - 1];
    if (lastReplay === undefined) throw new Error('expected replayed subscription');
    const lastSubscribeId = lastReplay.id;
    transport.push({ id: lastSubscribeId, type: 'result', success: true });
    await flushMicrotasks();
    const reversedSent = [...transport.sent].reverse();
    const snapshotFrame = reversedSent.find(
      (f): f is Extract<typeof f, { type: 'get_states' }> => f.type === 'get_states',
    );
    expect(snapshotFrame).toBeDefined();
    if (snapshotFrame === undefined) throw new Error('expected snapshot frame');
    transport.push({ id: snapshotFrame.id, type: 'result', success: true, result: [] });
    await flushMicrotasks();

    expect(client.state).toBe('open');
    expect(onSnapshot).toHaveBeenCalledWith([]);

    // Events on the new HA id should still reach the original callback.
    transport.push({ id: lastSubscribeId, type: 'event', event: { tag: 'after-reconnect' } });
    expect(callback).toHaveBeenLastCalledWith({ tag: 'after-reconnect' });
  });
});

describe('HaClient.close', () => {
  it('rejects pending requests and cancels reconnect', async () => {
    const { transport, client } = makeHarness();
    const connectPromise = client.connect();
    await completeAuth(transport);
    await connectPromise;

    const result = client.request({ type: 'get_states' });
    await client.close();
    await expect(result).rejects.toBeInstanceOf(HaConnectionLostError);
    expect(client.state).toBe('closed');
  });
});
