// Frame bridge — pumps frames between the cloud relay and the local HA WS.
//
// Direction A (client → HA): cloud relay sends a `ha_ws_frame` envelope; the
// bridge extracts `payload` and forwards it raw to HA.
//
// Direction B (HA → client): HA emits a raw frame; the bridge wraps it into a
// `ha_ws_frame` envelope tagged with `homeId` and the session id we pinned
// when the cloud relay first delivered an inbound client frame. (For the
// initial PR every outbound HA frame is broadcast to all live sessions; the
// per-session targeting is a follow-up under #345.)
//
// Control frames are short-circuited at the bridge layer:
//   - cloud → home_offline / pong: logged + ignored (the relay handles them)
//   - home → no control frames in this direction yet (heartbeat lives at the
//     transport layer, not here)

import { decodeFrame, encodeFrame, wrapHaPayload, type RelayFrame } from './protocol';

export interface BridgeSocket {
  send(data: string): void;
}

export interface BridgeContext {
  readonly homeId: string;
  /** Session id pinned to the most recent inbound client frame, used for outbound wraps. */
  pinnedSessionId: string | null;
}

export class FrameBridge {
  constructor(
    private readonly cloud: BridgeSocket,
    private readonly home: BridgeSocket,
    private readonly ctx: BridgeContext,
  ) {}

  /**
   * cloud → bridge: inbound from the client side. Decodes the envelope and
   * forwards the HA payload raw to the local HA WS. Pins `sessionId` so the
   * matching outbound HA frame can target the same client.
   */
  onCloudMessage(raw: string): void {
    const frame = decodeFrame(raw);
    if (frame === null) return;
    if (frame.type === 'control') return; // relay-managed; nothing to forward
    this.ctx.pinnedSessionId = frame.sessionId;
    this.home.send(frame.payload);
  }

  /**
   * home → bridge: HA emitted a raw frame. Wrap it in the relay envelope
   * pointed at the pinned session and forward to the cloud upstream.
   */
  onHomeMessage(raw: string): void {
    const sessionId = this.ctx.pinnedSessionId;
    if (sessionId === null) {
      // No pinned session yet — broadcast envelope with empty session id.
      // The relay DO falls back to fan-out across all clients per ADR 0018.
      const broadcast: RelayFrame = wrapHaPayload(this.ctx.homeId, '', raw);
      this.cloud.send(encodeFrame(broadcast));
      return;
    }
    const frame = wrapHaPayload(this.ctx.homeId, sessionId, raw);
    this.cloud.send(encodeFrame(frame));
  }
}
