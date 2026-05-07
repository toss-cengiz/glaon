// HomeSessionDO — per-home Durable Object. Owns the agent WebSocket and the
// fan-out to client WebSockets per ADR 0018 + ADR 0020. WebSocket Hibernation
// API keeps idle connections off the active-actor cost meter.
//
// PII discipline: the DO never parses `ha_ws_frame.payload` — it's an opaque
// string passed through to the matching peer. HA WS frames carry HA OAuth
// tokens during handshake; not parsing them is the cloud-relay invariant per
// ADR 0017 / 0018 risk C14.
//
// Scope of this PR:
// - Agent connect (single per home).
// - Client connect (multiple per home).
// - Fan-out: agent → all clients (broadcast).
// - Unicast: client → agent.
// - control: home_offline broadcast on agent disconnect.
// - control: pong reply to ping frames.
//
// Out of scope (#345 follow-ups):
// - Backpressure / flow_control signaling.
// - Mid-session JWT rotation (`session_refresh` control frame).
// - Sticky-session reconnect window with state replay.

import { decodeFrame, encodeFrame, type ControlFrame, type RelayFrame } from '../protocol/relay';

// Bindings the DO needs at runtime — kept narrow here. The Worker passes
// CLERK_ISSUER + DB through the request context, not via env, so tests can stub
// the DO without a full Worker harness. Empty for now; populates as cloud
// features layer on (e.g. metrics counters).
type HomeSessionEnv = Record<string, never>;

const ROLE_AGENT = 'agent';
const ROLE_CLIENT = 'client';

interface PeerMeta {
  readonly role: 'agent' | 'client';
  readonly sessionId: string;
}

/**
 * Cloudflare DurableObject contract surface that we rely on. Defining a slim
 * interface (vs. importing from `@cloudflare/workers-types` directly) keeps the
 * unit tests reachable without a full Workers runtime — production binds to the
 * real DO + Hibernation primitives.
 */
export interface DurableObjectStateLike {
  acceptWebSocket(ws: WebSocket, tags?: string[]): void;
  getWebSockets(tag?: string): WebSocket[];
}

export class HomeSessionDO {
  constructor(
    private readonly state: DurableObjectStateLike,
    _env: HomeSessionEnv,
  ) {}

  /**
   * Worker-side handler hands a peer-side WebSocket pair to the DO. The DO
   * accepts the server side via Hibernation and tags it with the role; runtime
   * frame routing reads the tags back from `getWebSockets`.
   */
  acceptPeer(server: WebSocket, meta: PeerMeta): void {
    const tag = `${meta.role}:${meta.sessionId}`;
    this.state.acceptWebSocket(server, [meta.role, tag]);
  }

  /**
   * Hibernation entry point. CF replays this on every inbound message; we route
   * by the tag set on the originating WS (agent → broadcast, client → unicast
   * to agent).
   */
  handleMessage(ws: WebSocket, data: string | ArrayBuffer): void {
    if (typeof data !== 'string') return;
    const frame = decodeFrame(data);
    if (frame === null) return;

    const tags = ws as WebSocket & { __tags?: string[] };
    const role = (tags.__tags ?? []).find((t) => t === ROLE_AGENT || t === ROLE_CLIENT);
    if (role === ROLE_AGENT) {
      // Agent → all clients for ha_ws_frame; per-session for unicast; control
      // frames pass through.
      this.broadcast(this.state.getWebSockets(ROLE_CLIENT), frame);
      return;
    }
    if (role === ROLE_CLIENT) {
      const agents = this.state.getWebSockets(ROLE_AGENT);
      const agent = agents[0];
      if (agent === undefined) {
        // No agent online → reply with home_offline.
        ws.send(
          encodeFrame({
            type: 'control',
            homeId: frame.homeId,
            ts: Date.now(),
            payload: { kind: 'home_offline', reason: 'agent_disconnected' },
          }),
        );
        return;
      }
      agent.send(encodeFrame(frame));
    }
  }

  /**
   * Hibernation close hook. If the agent leaves, broadcast `home_offline` so
   * each connected client can render the offline banner immediately.
   */
  handleClose(ws: WebSocket, info: { homeId: string }): void {
    const tags = ws as WebSocket & { __tags?: string[] };
    const role = (tags.__tags ?? []).find((t) => t === ROLE_AGENT || t === ROLE_CLIENT);
    if (role !== ROLE_AGENT) return;
    const offline: ControlFrame = { kind: 'home_offline', reason: 'agent_disconnected' };
    this.broadcast(this.state.getWebSockets(ROLE_CLIENT), {
      type: 'control',
      homeId: info.homeId,
      ts: Date.now(),
      payload: offline,
    });
  }

  private broadcast(targets: WebSocket[], frame: RelayFrame): void {
    const encoded = encodeFrame(frame);
    for (const target of targets) target.send(encoded);
  }
}
