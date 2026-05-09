// Mobile mode preference — UX hint that decides which auth tree the app
// mounts on the next cold start. Persisted via expo-secure-store; ADR 0006
// allows non-credential preferences here (the alternative would be
// AsyncStorage, which is banned in apps/mobile/src/auth/** by ESLint —
// outside that scope the rule doesn't apply, but SecureStore keeps the
// surface area small and consistent with the rest of the auth folder).

import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'glaon.mode-preference';

export type ModeChoice = 'local' | 'cloud';

export interface ModePreference {
  readonly mode: ModeChoice;
  readonly lastLocalUrl?: string;
}

export interface PreferenceStore {
  read(): Promise<ModePreference | null>;
  write(preference: ModePreference): Promise<void>;
  clear(): Promise<void>;
}

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const expoModePreferenceStore: PreferenceStore = {
  async read(): Promise<ModePreference | null> {
    let raw: string | null;
    try {
      raw = await SecureStore.getItemAsync(STORAGE_KEY, SECURE_STORE_OPTIONS);
    } catch {
      return null;
    }
    return parsePreference(raw);
  },
  async write(preference: ModePreference): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(preference), SECURE_STORE_OPTIONS);
    } catch {
      /* SecureStore is best-effort here — losing a preference falls back to
         the picker on next launch, which is the desired UX anyway. */
    }
  },
  async clear(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEY, SECURE_STORE_OPTIONS);
    } catch {
      /* ignore */
    }
  },
};

function parsePreference(raw: string | null): ModePreference | null {
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (parsed === null || typeof parsed !== 'object') return null;
  const candidate = parsed as Record<string, unknown>;
  if (candidate.mode !== 'local' && candidate.mode !== 'cloud') return null;
  const out: { mode: ModeChoice; lastLocalUrl?: string } = { mode: candidate.mode };
  if (typeof candidate.lastLocalUrl === 'string' && candidate.lastLocalUrl.length > 0) {
    out.lastLocalUrl = candidate.lastLocalUrl;
  }
  return out;
}
