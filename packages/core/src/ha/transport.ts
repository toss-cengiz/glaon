// Transport interface — see ADR 0016. HaClient (client.ts) consumes this; concrete
// implementations live under ./transports/ (DirectWsTransport for local mode now;
// CloudRelayTransport lands in a follow-up PR once the cloud relay backend / B3 #345
// is up).
//
// Transport-level invariants:
// - The transport carries opaque frames; HA-side `id` correlation, request/response
//   Promise resolution, and subscription routing are HaClient's job.
// - The transport surfaces lifecycle events ('open' is implicit through `connect()`
//   resolving; 'close' / 'error' / 'message' arrive via `on()`).
// - `connect()` resolves once the WS upgrade + (for cloud relay) any session-level
//   handshake has finished. HA's `auth_required` / `auth` / `auth_ok` exchange is
//   driven by HaClient over the open transport — not embedded here — so the same
//   handshake code works for direct and cloud-relayed paths.

import type { HaInboundFrame, HaOutboundFrame } from './protocol/messages';

export interface CloseInfo {
  /** Standard WebSocket close code (1000 normal, 1006 abnormal, etc.). */
  readonly code: number;
  /** Optional close reason. Empty string on abnormal close. */
  readonly reason: string;
  /** Whether the close was initiated by the client (`close()` call) or remote. */
  readonly clientInitiated: boolean;
}

export type TransportEvent = 'message' | 'close' | 'error';

export type TransportEventHandler<TEvent extends TransportEvent> = TEvent extends 'message'
  ? (frame: HaInboundFrame) => void
  : TEvent extends 'close'
    ? (info: CloseInfo) => void
    : (err: Error) => void;

/** Returns an unsubscribe function — calling it detaches the handler. */
export type TransportSubscription = () => void;

export interface HaTransport {
  connect(): Promise<void>;
  send(frame: HaOutboundFrame): void;
  on<TEvent extends TransportEvent>(
    event: TEvent,
    handler: TransportEventHandler<TEvent>,
  ): TransportSubscription;
  close(): Promise<void>;
}
