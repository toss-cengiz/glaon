// Glaon cloud relay wire envelope — see docs/adr/0018-cloud-relay-topology.md.
//
// The cloud relay never parses HA WS frames. They ride opaquely inside the
// envelope's `payload` field; only the relay envelope itself is shaped by
// Glaon. Control frames (pong, home_offline, session_refresh, revoked) are
// the only protocol Glaon owns end-to-end.

export interface RelayEnvelopeBase {
  readonly homeId: string;
  readonly sessionId: string;
  readonly ts: number;
}

export interface RelayHaWsFrameEnvelope extends RelayEnvelopeBase {
  readonly type: 'ha_ws_frame';
  readonly payload: unknown;
}

export type RelayControlFrame =
  | { readonly kind: 'pong' }
  | { readonly kind: 'home_offline'; readonly since: number }
  | { readonly kind: 'session_refresh'; readonly token: string; readonly expiresAt: number }
  | { readonly kind: 'revoked'; readonly reason: string };

export interface RelayControlEnvelope extends RelayEnvelopeBase {
  readonly type: 'control';
  readonly payload: RelayControlFrame;
}

export type RelayEnvelope = RelayHaWsFrameEnvelope | RelayControlEnvelope;
