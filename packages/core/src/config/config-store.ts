// Cross-platform device-config storage contract — see ADR 0028. One blob
// per device under `glaon.device-config`; platform adapters bind the
// interface to localStorage (web) or expo-secure-store (mobile).
//
// `isConfigured()` reads the `completedAt` timestamp, not field doluluk —
// adding optional fields to the schema does not retro-configure devices.
//
// Reading a corrupt blob (invalid JSON, schema mismatch) returns null and
// silently clears the key; the caller behaves as first-run. This is the
// downgrade / schema-migration recovery path documented in ADR 0028.

import type { KeyValueBackend } from '../auth/token-store';

import {
  DEVICE_CONFIG_SCHEMA_VERSION,
  DeviceConfigSchema,
  type DeviceConfig,
  type DeviceConfigInput,
} from './types';

export const DEVICE_CONFIG_STORAGE_KEY = 'glaon.device-config';

export interface ConfigStore {
  /**
   * Fetch the persisted device config, or `null` when first-run (key absent,
   * invalid JSON, or schema mismatch). On corruption the store silently
   * clears the key so the next call also returns `null` cheaply.
   */
  get(): Promise<DeviceConfig | null>;

  /**
   * Shallow-merge `partial` into the existing blob and persist the result.
   * Validates the merged shape — invalid input throws. `schemaVersion` is
   * set automatically; `completedAt` is reserved for `markComplete()`.
   */
  setPartial(partial: DeviceConfigInput): Promise<void>;

  /**
   * Stamp `completedAt: new Date().toISOString()` onto the blob. Idempotent —
   * a second call refreshes the timestamp. The wizard's final step is the
   * only legitimate caller.
   */
  markComplete(): Promise<void>;

  /**
   * Has the wizard ever finished on this device? Reads `completedAt`. Cheap
   * to call from a routing gate at boot.
   */
  isConfigured(): Promise<boolean>;

  /**
   * Erase the persisted blob. Safe to call when no blob exists. The future
   * factory-reset action's only entry point into this store.
   */
  clear(): Promise<void>;
}

/**
 * Reference implementation that holds the blob in a single variable.
 * Test fixture; also fine as a transient in-memory store when persistence
 * is intentionally not wanted (e.g. demo / kiosk preview mode).
 */
/* eslint-disable @typescript-eslint/require-await */
export class InMemoryConfigStore implements ConfigStore {
  private blob: DeviceConfig | null = null;

  async get(): Promise<DeviceConfig | null> {
    return this.blob;
  }

  async setPartial(partial: DeviceConfigInput): Promise<void> {
    const base = this.blob ?? { schemaVersion: DEVICE_CONFIG_SCHEMA_VERSION };
    this.blob = DeviceConfigSchema.parse({ ...base, ...partial });
  }

  async markComplete(): Promise<void> {
    const base = this.blob ?? { schemaVersion: DEVICE_CONFIG_SCHEMA_VERSION };
    this.blob = DeviceConfigSchema.parse({
      ...base,
      completedAt: new Date().toISOString(),
    });
  }

  async isConfigured(): Promise<boolean> {
    return Boolean(this.blob?.completedAt);
  }

  async clear(): Promise<void> {
    this.blob = null;
  }
}
/* eslint-enable @typescript-eslint/require-await */

/**
 * ConfigStore backed by a key-value primitive. Persists as JSON under
 * `DEVICE_CONFIG_STORAGE_KEY`. Web pairs this with a `localStorage` adapter
 * (#536); mobile with an `expo-secure-store` adapter (follow-up).
 *
 * Web does not strictly need an async wrapper — localStorage is synchronous —
 * but the `Promise.resolve()` cost is negligible and keeping the contract
 * uniform across platforms makes the SetupGate boot path identical too.
 */
export class KeyValueConfigStore implements ConfigStore {
  constructor(private readonly backend: KeyValueBackend) {}

  async get(): Promise<DeviceConfig | null> {
    const raw = await this.backend.get(DEVICE_CONFIG_STORAGE_KEY);
    if (raw == null) return null;

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch (error) {
      console.warn('[ConfigStore] invalid JSON in device-config; clearing', error);
      await this.backend.delete(DEVICE_CONFIG_STORAGE_KEY);
      return null;
    }

    const validated = DeviceConfigSchema.safeParse(parsedJson);
    if (!validated.success) {
      console.warn('[ConfigStore] device-config schema mismatch; clearing', validated.error);
      await this.backend.delete(DEVICE_CONFIG_STORAGE_KEY);
      return null;
    }
    return validated.data;
  }

  async setPartial(partial: DeviceConfigInput): Promise<void> {
    const current = (await this.get()) ?? { schemaVersion: DEVICE_CONFIG_SCHEMA_VERSION };
    const next = DeviceConfigSchema.parse({ ...current, ...partial });
    await this.backend.set(DEVICE_CONFIG_STORAGE_KEY, JSON.stringify(next));
  }

  async markComplete(): Promise<void> {
    const current = (await this.get()) ?? { schemaVersion: DEVICE_CONFIG_SCHEMA_VERSION };
    const next = DeviceConfigSchema.parse({
      ...current,
      completedAt: new Date().toISOString(),
    });
    await this.backend.set(DEVICE_CONFIG_STORAGE_KEY, JSON.stringify(next));
  }

  async isConfigured(): Promise<boolean> {
    const current = await this.get();
    return Boolean(current?.completedAt);
  }

  async clear(): Promise<void> {
    await this.backend.delete(DEVICE_CONFIG_STORAGE_KEY);
  }
}
