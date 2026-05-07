// HA WebSocket protocol — message shapes used by Glaon. See:
// https://developers.home-assistant.io/docs/api/websocket
//
// Inbound (HA → client) frames keep HA's snake_case payload shape verbatim. Outbound
// (client → HA) frames likewise — HaClient stamps the auto-incremented `id` per ADR 0016.

import type { HaEntityState } from '../../types';

/* ---------- Auth handshake ---------- */

export interface HaAuthRequiredFrame {
  readonly type: 'auth_required';
  readonly ha_version: string;
}

export interface HaAuthOkFrame {
  readonly type: 'auth_ok';
  readonly ha_version: string;
}

export interface HaAuthInvalidFrame {
  readonly type: 'auth_invalid';
  readonly message: string;
}

export interface HaAuthFrame {
  readonly type: 'auth';
  readonly access_token: string;
}

/* ---------- Pings + heartbeats ---------- */

export interface HaPingFrame {
  readonly id: number;
  readonly type: 'ping';
}

export interface HaPongFrame {
  readonly id: number;
  readonly type: 'pong';
}

/* ---------- Result frames (response to a numbered request) ---------- */

export interface HaResultFrame<TResult = unknown> {
  readonly id: number;
  readonly type: 'result';
  readonly success: boolean;
  readonly result?: TResult;
  readonly error?: { readonly code: string; readonly message: string };
}

/* ---------- Subscriptions ---------- */

export interface HaSubscribeEventsFrame {
  readonly id: number;
  readonly type: 'subscribe_events';
  readonly event_type?: string;
}

export interface HaSubscribeEntitiesFrame {
  readonly id: number;
  readonly type: 'subscribe_entities';
  readonly entity_ids?: readonly string[];
}

export interface HaUnsubscribeEventsFrame {
  readonly id: number;
  readonly type: 'unsubscribe_events';
  readonly subscription: number;
}

export interface HaEventFrame<TEvent = unknown> {
  readonly id: number;
  readonly type: 'event';
  readonly event: TEvent;
}

/* ---------- Specific events Glaon consumes ---------- */

export interface HaStateChangedEvent {
  readonly event_type: 'state_changed';
  readonly data: {
    readonly entity_id: string;
    readonly old_state: HaEntityState | null;
    readonly new_state: HaEntityState | null;
  };
  readonly origin: 'LOCAL' | 'REMOTE';
  readonly time_fired: string;
}

/* ---------- Service calls ---------- */

export interface HaCallServiceFrame {
  readonly id: number;
  readonly type: 'call_service';
  readonly domain: string;
  readonly service: string;
  readonly service_data?: Readonly<Record<string, unknown>>;
  readonly target?: {
    readonly entity_id?: string | readonly string[];
    readonly area_id?: string | readonly string[];
    readonly device_id?: string | readonly string[];
  };
}

export interface HaGetStatesFrame {
  readonly id: number;
  readonly type: 'get_states';
}

/* ---------- Aggregates ---------- */

export type HaInboundFrame =
  | HaAuthRequiredFrame
  | HaAuthOkFrame
  | HaAuthInvalidFrame
  | HaPongFrame
  | HaResultFrame
  | HaEventFrame;

export type HaOutboundFrame =
  | HaAuthFrame
  | HaPingFrame
  | HaSubscribeEventsFrame
  | HaSubscribeEntitiesFrame
  | HaUnsubscribeEventsFrame
  | HaCallServiceFrame
  | HaGetStatesFrame;
