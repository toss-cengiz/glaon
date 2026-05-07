// Relay wire envelope per ADR 0018. Two top-level frame kinds:
//
// - `ha_ws_frame`: opaque HA WebSocket payload that the relay forwards verbatim.
//   The relay does not parse it (PII scrubber rule). `payload` is the raw HA frame
//   stringified (browsers can JSON.parse it on the other side).
//
// - `control`: relay-managed signaling. Subtypes here are the ones this PR ships;
//   the union grows as cloud features land.

export type ControlFrame =
  | { readonly kind: 'pong' }
  | { readonly kind: 'home_offline'; readonly reason: 'agent_disconnected' | 'revoked' }
  | { readonly kind: 'session_refresh'; readonly token: string }
  | { readonly kind: 'flow_control'; readonly state: 'pause' | 'resume' };

export type RelayFrame =
  | {
      readonly type: 'ha_ws_frame';
      readonly homeId: string;
      readonly sessionId: string;
      readonly ts: number;
      readonly payload: string;
    }
  | {
      readonly type: 'control';
      readonly homeId: string;
      readonly sessionId?: string;
      readonly ts: number;
      readonly payload: ControlFrame;
    };

function isRelayFrame(input: unknown): input is RelayFrame {
  if (input === null || typeof input !== 'object') return false;
  const f = input as Record<string, unknown>;
  if (f.type !== 'ha_ws_frame' && f.type !== 'control') return false;
  if (typeof f.homeId !== 'string' || typeof f.ts !== 'number') return false;
  if (f.type === 'ha_ws_frame') {
    return typeof f.sessionId === 'string' && typeof f.payload === 'string';
  }
  // control: payload is ControlFrame
  return typeof f.payload === 'object' && f.payload !== null;
}

export function encodeFrame(frame: RelayFrame): string {
  return JSON.stringify(frame);
}

export function decodeFrame(raw: string): RelayFrame | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  return isRelayFrame(parsed) ? parsed : null;
}
