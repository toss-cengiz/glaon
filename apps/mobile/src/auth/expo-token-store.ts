// Mobile TokenStore implementation — see ADR 0006 (Phase 2 revision via ADR 0017) and issue #9.
//
// All three slots (ha-access, ha-refresh, cloud-session) live in expo-secure-store, which is
// backed by iOS Keychain and Android Keystore. Hardware-backed encryption + per-device-only
// access (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`) makes off-device exfiltration impractical without
// physical compromise.
//
// AsyncStorage and any other plain-file storage are forbidden in this file. An ESLint guard
// blocks the import of `@react-native-async-storage/async-storage` from `apps/mobile/src/auth/**`.

import * as SecureStore from 'expo-secure-store';

import { KeyValueTokenStore, type KeyValueBackend, type TokenStore } from '@glaon/core/auth';

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const expoSecureStoreBackend: KeyValueBackend = {
  async get(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key, SECURE_STORE_OPTIONS);
  },
  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value, SECURE_STORE_OPTIONS);
  },
  async delete(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key, SECURE_STORE_OPTIONS);
  },
};

/**
 * Factory for the mobile TokenStore. Returns a `KeyValueTokenStore` bound to expo-secure-store
 * — the real `TokenStore` interface implementation.
 *
 * Single backend instance is reused across calls (SecureStore itself is process-global).
 */
export function createExpoTokenStore(): TokenStore {
  return new KeyValueTokenStore(expoSecureStoreBackend);
}
