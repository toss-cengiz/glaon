// Web ConfigStore implementation — see ADR 0028 and #533.
//
// The cross-platform `KeyValueConfigStore` does all the heavy lifting (JSON
// codec, schema-validation-on-read, corrupt-blob recovery). Web's only
// responsibility is binding it to `window.localStorage` and exposing a
// synchronous `peekSync()` boot helper so `SetupGate` (#539) does not flash
// the login screen while the async `get()` resolves.

import {
  DEVICE_CONFIG_STORAGE_KEY,
  DeviceConfigSchema,
  KeyValueConfigStore,
  type DeviceConfig,
} from '@glaon/core/config';
import type { KeyValueBackend } from '@glaon/core/auth';

export class LocalStorageBackend implements KeyValueBackend {
  get(key: string): Promise<string | null> {
    return Promise.resolve(window.localStorage.getItem(key));
  }
  set(key: string, value: string): Promise<void> {
    window.localStorage.setItem(key, value);
    return Promise.resolve();
  }
  delete(key: string): Promise<void> {
    window.localStorage.removeItem(key);
    return Promise.resolve();
  }
}

interface WebConfigStoreOptions {
  /** Backend override; tests inject an in-memory map. Production passes nothing. */
  readonly backend?: KeyValueBackend;
}

export class WebConfigStore extends KeyValueConfigStore {
  constructor(options: WebConfigStoreOptions = {}) {
    super(options.backend ?? new LocalStorageBackend());
  }

  /**
   * Synchronous best-effort read of the persisted blob. Used by App.tsx /
   * ConfigProvider to hydrate React state on the same tick as the first
   * render — avoids the wizard-vs-login flash that an async hydrate causes.
   *
   * Returns `null` when the key is missing, the JSON is invalid, or the
   * schema mismatches. Does NOT clear the key on failure (the async `get()`
   * path on the next interaction takes care of recovery so this stays
   * side-effect-free for boot).
   */
  peekSync(): DeviceConfig | null {
    let raw: string | null;
    try {
      raw = window.localStorage.getItem(DEVICE_CONFIG_STORAGE_KEY);
    } catch {
      return null;
    }
    if (raw == null) return null;

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      return null;
    }

    const validated = DeviceConfigSchema.safeParse(parsedJson);
    return validated.success ? validated.data : null;
  }
}
