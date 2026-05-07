import { describe, expect, it } from 'vitest';

import { encodeFrame, type RelayFrame } from '../protocol/relay';

import { HomeSessionDO, type DurableObjectStateLike } from './home-session';

function makeSocket(tags: string[]): WebSocket & { __tags: string[]; sent: string[] } {
  const sent: string[] = [];
  const ws = {
    __tags: tags,
    sent,
    send: (data: string) => {
      sent.push(data);
    },
  } as unknown as WebSocket & { __tags: string[]; sent: string[] };
  return ws;
}

class FakeState implements DurableObjectStateLike {
  readonly sockets: (WebSocket & { __tags: string[] })[] = [];

  acceptWebSocket(ws: WebSocket, tags?: string[]): void {
    (ws as WebSocket & { __tags: string[] }).__tags = tags ?? [];
    this.sockets.push(ws as WebSocket & { __tags: string[] });
  }

  getWebSockets(tag?: string): WebSocket[] {
    if (tag === undefined) return this.sockets;
    return this.sockets.filter((s) => s.__tags.includes(tag));
  }
}

function frame(_role: 'agent' | 'client', sessionId: string, payload: string): RelayFrame {
  return {
    type: 'ha_ws_frame',
    homeId: 'home-1',
    sessionId,
    ts: 0,
    payload,
  };
}

describe('HomeSessionDO', () => {
  it('fans out an agent ha_ws_frame to every connected client', () => {
    const state = new FakeState();
    const env = {};
    const home = new HomeSessionDO(state, env);

    const agent = makeSocket(['agent', 'agent:s-agent']);
    home.acceptPeer(agent, { role: 'agent', sessionId: 's-agent' });
    const clientA = makeSocket(['client', 'client:s-a']);
    home.acceptPeer(clientA, { role: 'client', sessionId: 's-a' });
    const clientB = makeSocket(['client', 'client:s-b']);
    home.acceptPeer(clientB, { role: 'client', sessionId: 's-b' });

    home.handleMessage(agent, encodeFrame(frame('agent', 's-agent', 'state_changed')));

    expect((clientA as { sent: string[] }).sent).toHaveLength(1);
    expect((clientB as { sent: string[] }).sent).toHaveLength(1);
    expect((agent as { sent: string[] }).sent).toHaveLength(0);
  });

  it('forwards a client frame to the agent only', () => {
    const state = new FakeState();
    const home = new HomeSessionDO(state, {});

    const agent = makeSocket(['agent', 'agent:s-agent']);
    home.acceptPeer(agent, { role: 'agent', sessionId: 's-agent' });
    const clientA = makeSocket(['client', 'client:s-a']);
    home.acceptPeer(clientA, { role: 'client', sessionId: 's-a' });
    const clientB = makeSocket(['client', 'client:s-b']);
    home.acceptPeer(clientB, { role: 'client', sessionId: 's-b' });

    home.handleMessage(clientA, encodeFrame(frame('client', 's-a', 'call_service')));

    expect((agent as { sent: string[] }).sent).toHaveLength(1);
    expect((clientB as { sent: string[] }).sent).toHaveLength(0);
  });

  it('replies with home_offline when a client sends and no agent is connected', () => {
    const state = new FakeState();
    const home = new HomeSessionDO(state, {});

    const clientA = makeSocket(['client', 'client:s-a']);
    home.acceptPeer(clientA, { role: 'client', sessionId: 's-a' });

    home.handleMessage(clientA, encodeFrame(frame('client', 's-a', 'noop')));

    const sent = (clientA as { sent: string[] }).sent;
    expect(sent).toHaveLength(1);
    const raw = sent[0];
    if (raw === undefined) throw new Error('expected reply');
    const reply = JSON.parse(raw) as RelayFrame;
    expect(reply.type).toBe('control');
    if (reply.type === 'control') {
      expect(reply.payload.kind).toBe('home_offline');
    }
  });

  it('broadcasts home_offline when the agent disconnects', () => {
    const state = new FakeState();
    const home = new HomeSessionDO(state, {});

    const agent = makeSocket(['agent', 'agent:s-agent']);
    home.acceptPeer(agent, { role: 'agent', sessionId: 's-agent' });
    const clientA = makeSocket(['client', 'client:s-a']);
    home.acceptPeer(clientA, { role: 'client', sessionId: 's-a' });

    home.handleClose(agent, { homeId: 'home-1' });

    const sent = (clientA as { sent: string[] }).sent;
    expect(sent).toHaveLength(1);
    const raw = sent[0];
    if (raw === undefined) throw new Error('expected reply');
    const reply = JSON.parse(raw) as RelayFrame;
    expect(reply.type).toBe('control');
    if (reply.type === 'control') {
      expect(reply.payload.kind).toBe('home_offline');
      if (reply.payload.kind === 'home_offline') {
        expect(reply.payload.reason).toBe('agent_disconnected');
      }
    }
  });

  it('ignores garbage payloads (decode failure)', () => {
    const state = new FakeState();
    const home = new HomeSessionDO(state, {});
    const agent = makeSocket(['agent', 'agent:s-agent']);
    home.acceptPeer(agent, { role: 'agent', sessionId: 's-agent' });

    expect(() => {
      home.handleMessage(agent, 'not json');
    }).not.toThrow();
    expect((agent as { sent: string[] }).sent).toHaveLength(0);
  });
});
