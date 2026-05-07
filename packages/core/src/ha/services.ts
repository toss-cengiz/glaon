// Typed wrappers around HA service calls — see issue #12. With dual-mode auth
// (ADR 0017) the API stays transport-agnostic: `callService` writes a `call_service`
// frame to whichever HaClient instance is active, the underlying transport is
// invisible at this layer. Optimistic-update + rollback hooks live in the React /
// RN feature layer, not in @glaon/core (ADR 0004 boundary).

import type { HaClient } from './client';
import type { HaOutboundFrame } from './protocol/messages';

export type ServiceTargetEntity = string | readonly string[];

export interface ServiceTarget {
  readonly entity_id?: ServiceTargetEntity;
  readonly area_id?: string | readonly string[];
  readonly device_id?: string | readonly string[];
}

export interface CallServiceOptions {
  readonly data?: Readonly<Record<string, unknown>>;
  readonly target?: ServiceTarget;
}

type CallServiceRequest = Omit<Extract<HaOutboundFrame, { type: 'call_service' }>, 'id'>;

export function callService(
  client: HaClient,
  domain: string,
  service: string,
  options: CallServiceOptions = {},
): Promise<unknown> {
  const frame: CallServiceRequest = {
    type: 'call_service',
    domain,
    service,
    ...(options.data !== undefined && { service_data: options.data }),
    ...(options.target !== undefined && { target: options.target }),
  };
  return client.request(frame);
}

/* ---------- typed helpers per domain ---------- */

function entityTarget(target: ServiceTargetEntity): ServiceTarget {
  return { entity_id: target };
}

function withOptionalData(
  base: { readonly target: ServiceTarget },
  data: Readonly<Record<string, unknown>> | undefined,
): CallServiceOptions {
  return data === undefined ? base : { ...base, data };
}

export const light = {
  turnOn(
    client: HaClient,
    target: ServiceTargetEntity,
    data?: Readonly<Record<string, unknown>>,
  ): Promise<unknown> {
    return callService(
      client,
      'light',
      'turn_on',
      withOptionalData({ target: entityTarget(target) }, data),
    );
  },
  turnOff(client: HaClient, target: ServiceTargetEntity): Promise<unknown> {
    return callService(client, 'light', 'turn_off', { target: entityTarget(target) });
  },
  toggle(
    client: HaClient,
    target: ServiceTargetEntity,
    data?: Readonly<Record<string, unknown>>,
  ): Promise<unknown> {
    return callService(
      client,
      'light',
      'toggle',
      withOptionalData({ target: entityTarget(target) }, data),
    );
  },
};

export const switchDomain = {
  toggle(client: HaClient, target: ServiceTargetEntity): Promise<unknown> {
    return callService(client, 'switch', 'toggle', { target: entityTarget(target) });
  },
};

export interface ClimateTemperaturePayload {
  readonly temperature?: number;
  readonly target_temp_high?: number;
  readonly target_temp_low?: number;
}

export const climate = {
  setTemperature(
    client: HaClient,
    target: ServiceTargetEntity,
    payload: ClimateTemperaturePayload,
  ): Promise<unknown> {
    return callService(client, 'climate', 'set_temperature', {
      target: entityTarget(target),
      data: { ...payload },
    });
  },
  setHvacMode(client: HaClient, target: ServiceTargetEntity, hvacMode: string): Promise<unknown> {
    return callService(client, 'climate', 'set_hvac_mode', {
      target: entityTarget(target),
      data: { hvac_mode: hvacMode },
    });
  },
};

export const cover = {
  openCover(client: HaClient, target: ServiceTargetEntity): Promise<unknown> {
    return callService(client, 'cover', 'open_cover', { target: entityTarget(target) });
  },
  closeCover(client: HaClient, target: ServiceTargetEntity): Promise<unknown> {
    return callService(client, 'cover', 'close_cover', { target: entityTarget(target) });
  },
  stopCover(client: HaClient, target: ServiceTargetEntity): Promise<unknown> {
    return callService(client, 'cover', 'stop_cover', { target: entityTarget(target) });
  },
};

export const mediaPlayer = {
  play(client: HaClient, target: ServiceTargetEntity): Promise<unknown> {
    return callService(client, 'media_player', 'media_play', { target: entityTarget(target) });
  },
  pause(client: HaClient, target: ServiceTargetEntity): Promise<unknown> {
    return callService(client, 'media_player', 'media_pause', { target: entityTarget(target) });
  },
  stop(client: HaClient, target: ServiceTargetEntity): Promise<unknown> {
    return callService(client, 'media_player', 'media_stop', { target: entityTarget(target) });
  },
  volumeSet(client: HaClient, target: ServiceTargetEntity, volumeLevel: number): Promise<unknown> {
    return callService(client, 'media_player', 'volume_set', {
      target: entityTarget(target),
      data: { volume_level: volumeLevel },
    });
  },
};
