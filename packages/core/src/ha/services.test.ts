import { describe, expect, it } from 'vitest';

import { HaClient, HaServiceError } from './client';
import { climate, cover, light, mediaPlayer, switchDomain } from './services';
import { FakeTransport } from './testing/fake-transport';

async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 16; i++) {
    await Promise.resolve();
  }
}

async function bootClient(transport: FakeTransport): Promise<HaClient> {
  const client = new HaClient(() => transport, {
    getAccessToken: () => Promise.resolve('access-1'),
    heartbeatIntervalMs: 0,
    reconnectBaseDelayMs: 1,
    reconnectMaxDelayMs: 1,
    random: () => 0,
  });
  const connectPromise = client.connect();
  await flushMicrotasks();
  transport.push({ type: 'auth_required', ha_version: '2025.5.0' });
  await flushMicrotasks();
  transport.push({ type: 'auth_ok', ha_version: '2025.5.0' });
  await connectPromise;
  return client;
}

describe('light helpers', () => {
  it('turnOn forwards target + data on the call_service frame', async () => {
    const transport = new FakeTransport();
    const client = await bootClient(transport);

    const result = light.turnOn(client, 'light.kitchen', { brightness: 200 });
    await flushMicrotasks();
    const sent = transport.sent.at(-1);
    expect(sent).toEqual({
      id: 1,
      type: 'call_service',
      domain: 'light',
      service: 'turn_on',
      service_data: { brightness: 200 },
      target: { entity_id: 'light.kitchen' },
    });
    transport.push({ id: 1, type: 'result', success: true, result: { changed: true } });
    await expect(result).resolves.toEqual({ changed: true });
  });

  it('turnOff omits service_data', async () => {
    const transport = new FakeTransport();
    const client = await bootClient(transport);

    void light.turnOff(client, ['light.kitchen', 'light.living']);
    await flushMicrotasks();
    const sent = transport.sent.at(-1);
    expect(sent).toEqual({
      id: 1,
      type: 'call_service',
      domain: 'light',
      service: 'turn_off',
      service_data: undefined,
      target: { entity_id: ['light.kitchen', 'light.living'] },
    });
  });
});

describe('switch / cover / media_player helpers', () => {
  it('switchDomain.toggle issues switch.toggle', async () => {
    const transport = new FakeTransport();
    const client = await bootClient(transport);
    void switchDomain.toggle(client, 'switch.fan');
    await flushMicrotasks();
    expect(transport.sent.at(-1)).toMatchObject({
      domain: 'switch',
      service: 'toggle',
      target: { entity_id: 'switch.fan' },
    });
  });

  it('cover.openCover, closeCover, stopCover dispatch the right service names', async () => {
    const transport = new FakeTransport();
    const client = await bootClient(transport);
    void cover.openCover(client, 'cover.garage');
    void cover.closeCover(client, 'cover.garage');
    void cover.stopCover(client, 'cover.garage');
    await flushMicrotasks();
    expect(transport.sent.slice(-3).map((f) => 'service' in f && f.service)).toEqual([
      'open_cover',
      'close_cover',
      'stop_cover',
    ]);
  });

  it('mediaPlayer.volumeSet attaches volume_level to service_data', async () => {
    const transport = new FakeTransport();
    const client = await bootClient(transport);
    void mediaPlayer.volumeSet(client, 'media_player.tv', 0.4);
    await flushMicrotasks();
    expect(transport.sent.at(-1)).toMatchObject({
      domain: 'media_player',
      service: 'volume_set',
      service_data: { volume_level: 0.4 },
    });
  });
});

describe('climate helpers', () => {
  it('setTemperature spreads the payload fields onto service_data', async () => {
    const transport = new FakeTransport();
    const client = await bootClient(transport);
    void climate.setTemperature(client, 'climate.living', {
      target_temp_high: 24,
      target_temp_low: 19,
    });
    await flushMicrotasks();
    expect(transport.sent.at(-1)).toMatchObject({
      domain: 'climate',
      service: 'set_temperature',
      service_data: { target_temp_high: 24, target_temp_low: 19 },
    });
  });

  it('setHvacMode sets hvac_mode on service_data', async () => {
    const transport = new FakeTransport();
    const client = await bootClient(transport);
    void climate.setHvacMode(client, 'climate.living', 'cool');
    await flushMicrotasks();
    expect(transport.sent.at(-1)).toMatchObject({
      domain: 'climate',
      service: 'set_hvac_mode',
      service_data: { hvac_mode: 'cool' },
    });
  });
});

describe('error mapping', () => {
  it('rejects with HaServiceError when HA returns success: false', async () => {
    const transport = new FakeTransport();
    const client = await bootClient(transport);
    const result = light.turnOn(client, 'light.kitchen');
    await flushMicrotasks();
    transport.push({
      id: 1,
      type: 'result',
      success: false,
      error: { code: 'service_not_found', message: 'no such service' },
    });
    await expect(result).rejects.toBeInstanceOf(HaServiceError);
    await expect(result).rejects.toMatchObject({ code: 'service_not_found' });
  });
});
