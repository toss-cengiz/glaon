import { describe, expect, it } from 'vitest';

import { FrameBridge, type BridgeContext, type BridgeSocket } from './bridge';
import { encodeFrame, type wrapHaPayload } from './protocol';

function makeSocket(): BridgeSocket & { sent: string[] } {
  const sent: string[] = [];
  return {
    sent,
    send: (d) => sent.push(d),
  };
}

function makeCtx(): BridgeContext {
  return { homeId: 'home-1', pinnedSessionId: null };
}

describe('FrameBridge', () => {
  it('forwards a cloud ha_ws_frame payload raw to HA and pins the session id', () => {
    const cloud = makeSocket();
    const home = makeSocket();
    const ctx = makeCtx();
    const bridge = new FrameBridge(cloud, home, ctx);

    const inbound = encodeFrame({
      type: 'ha_ws_frame',
      homeId: 'home-1',
      sessionId: 'sess-A',
      ts: 1,
      payload: '{"type":"call_service"}',
    });
    bridge.onCloudMessage(inbound);

    expect(home.sent).toEqual(['{"type":"call_service"}']);
    expect(ctx.pinnedSessionId).toBe('sess-A');
    expect(cloud.sent).toHaveLength(0);
  });

  it('wraps an HA payload into the relay envelope using the pinned session', () => {
    const cloud = makeSocket();
    const home = makeSocket();
    const ctx = makeCtx();
    ctx.pinnedSessionId = 'sess-A';
    const bridge = new FrameBridge(cloud, home, ctx);

    bridge.onHomeMessage('{"event":"state_changed"}');

    expect(cloud.sent).toHaveLength(1);
    const raw = cloud.sent[0];
    if (raw === undefined) throw new Error('expected cloud send');
    const sent = JSON.parse(raw) as ReturnType<typeof wrapHaPayload>;
    expect(sent.type).toBe('ha_ws_frame');
    if (sent.type === 'ha_ws_frame') {
      expect(sent.homeId).toBe('home-1');
      expect(sent.sessionId).toBe('sess-A');
      expect(sent.payload).toBe('{"event":"state_changed"}');
    }
  });

  it('falls back to a broadcast envelope (empty sessionId) when no session is pinned', () => {
    const cloud = makeSocket();
    const home = makeSocket();
    const bridge = new FrameBridge(cloud, home, makeCtx());

    bridge.onHomeMessage('{"event":"state_changed"}');

    expect(cloud.sent).toHaveLength(1);
    const raw = cloud.sent[0];
    if (raw === undefined) throw new Error('expected cloud send');
    const sent = JSON.parse(raw) as ReturnType<typeof wrapHaPayload>;
    if (sent.type === 'ha_ws_frame') {
      expect(sent.sessionId).toBe('');
    }
  });

  it('ignores cloud control frames (relay-managed)', () => {
    const cloud = makeSocket();
    const home = makeSocket();
    const bridge = new FrameBridge(cloud, home, makeCtx());

    bridge.onCloudMessage(
      encodeFrame({
        type: 'control',
        homeId: 'home-1',
        ts: 1,
        payload: { kind: 'pong' },
      }),
    );

    expect(home.sent).toHaveLength(0);
    expect(cloud.sent).toHaveLength(0);
  });

  it('drops malformed cloud frames silently', () => {
    const cloud = makeSocket();
    const home = makeSocket();
    const bridge = new FrameBridge(cloud, home, makeCtx());

    bridge.onCloudMessage('not json');
    bridge.onCloudMessage(JSON.stringify({ type: 'unknown' }));

    expect(home.sent).toHaveLength(0);
  });
});
