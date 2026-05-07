// Glaon relay envelope (mirror of apps/cloud/src/protocol/relay.ts) — ADR 0018.
// Kept duplicated rather than shared because the agent ships as a separately
// bundled binary inside the addon image; pulling @glaon/cloud as a runtime
// dep would bloat the worker bundle into the agent. The shape here is a strict
// subset; envelope changes land on both sides.

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

export function decodeFrame(raw: string): RelayFrame | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (parsed === null || typeof parsed !== 'object') return null;
  const f = parsed as Record<string, unknown>;
  if (f.type !== 'ha_ws_frame' && f.type !== 'control') return null;
  if (typeof f.homeId !== 'string' || typeof f.ts !== 'number') return null;
  return parsed as RelayFrame;
}

export function encodeFrame(frame: RelayFrame): string {
  return JSON.stringify(frame);
}

export function wrapHaPayload(homeId: string, sessionId: string, payload: string): RelayFrame {
  return {
    type: 'ha_ws_frame',
    homeId,
    sessionId,
    ts: Date.now(),
    payload,
  };
}
