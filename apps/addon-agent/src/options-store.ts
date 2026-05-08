// Read/write the addon's `/data/options.json` (HA Supervisor's standard path).
//
// Pairing (#349) needs to persist `cloud_url` + `home_id` + `relay_secret`
// after the cloud accepts the device code. We write atomically (tmp + rename)
// at mode 0600 to avoid a half-written file if the supervisor restarts the
// container mid-write — and to keep the relay secret out of world-readable
// scope. HA Supervisor reads the file via `bashio::config` (the same shell
// helper used in `run.sh`); the JSON shape mirrors `addon/config.yaml`.

import { closeSync, openSync, readFileSync, renameSync, writeSync } from 'node:fs';
import { dirname } from 'node:path';

export interface AddonOptions {
  readonly cloud_url?: string;
  readonly home_id?: string;
  readonly relay_secret?: string;
}

export interface OptionsStore {
  read(): AddonOptions;
  write(options: AddonOptions): void;
}

export class FileOptionsStore implements OptionsStore {
  constructor(private readonly path: string) {}

  read(): AddonOptions {
    try {
      const raw = readFileSync(this.path, 'utf-8');
      const parsed: unknown = JSON.parse(raw);
      if (parsed === null || typeof parsed !== 'object') return {};
      const candidate = parsed as Record<string, unknown>;
      const out: AddonOptions = {};
      if (typeof candidate.cloud_url === 'string') {
        (out as { cloud_url?: string }).cloud_url = candidate.cloud_url;
      }
      if (typeof candidate.home_id === 'string') {
        (out as { home_id?: string }).home_id = candidate.home_id;
      }
      if (typeof candidate.relay_secret === 'string') {
        (out as { relay_secret?: string }).relay_secret = candidate.relay_secret;
      }
      return out;
    } catch {
      return {};
    }
  }

  write(options: AddonOptions): void {
    const payload = JSON.stringify(options, null, 2);
    const tmp = `${this.path}.tmp`;
    // mode 0o600 — owner read/write only. The relay_secret is sensitive and
    // must not be world-readable even though the addon container is single
    // tenant; defense-in-depth per ADR 0021 risk mitigations.
    const fd = openSync(tmp, 'w', 0o600);
    try {
      writeSync(fd, payload);
    } finally {
      closeSync(fd);
    }
    renameSync(tmp, this.path);
  }
}

export function isPaired(options: AddonOptions): boolean {
  return (
    typeof options.cloud_url === 'string' &&
    options.cloud_url.length > 0 &&
    typeof options.home_id === 'string' &&
    options.home_id.length > 0 &&
    typeof options.relay_secret === 'string' &&
    options.relay_secret.length > 0
  );
}

export function pairedDirectoryOf(path: string): string {
  return dirname(path);
}
