// Clerk's mobile SDK persists its session via a `tokenCache` adapter. We
// route every read / write through `expo-secure-store` so the Clerk JWT
// (alongside the HA OAuth tokens already managed by `expo-token-store.ts`)
// lives in iOS Keychain / Android Keystore — never AsyncStorage. The
// `**/auth/**` ESLint guard already blocks AsyncStorage imports from this
// directory; the cache is the implementation that satisfies the rule.

import * as SecureStore from 'expo-secure-store';

interface ClerkTokenCache {
  getToken(key: string): Promise<string | null>;
  saveToken(key: string, token: string): Promise<void>;
  clearToken?(key: string): Promise<void>;
}

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const expoTokenCache: ClerkTokenCache = {
  async getToken(key) {
    return SecureStore.getItemAsync(key, SECURE_STORE_OPTIONS);
  },
  async saveToken(key, token) {
    await SecureStore.setItemAsync(key, token, SECURE_STORE_OPTIONS);
  },
  async clearToken(key) {
    await SecureStore.deleteItemAsync(key, SECURE_STORE_OPTIONS);
  },
};
