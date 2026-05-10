// Last-known-locale cache for cold-start hydration (#431 / i18n-I).
//
// On a real cold start the provider runs `useLocales()` synchronously
// from `expo-localization`, so the OS locale is already in hand by
// the time React commits. The cache exists for two follow-on cases:
//
//   1. The user picked an explicit locale in-app (settings switcher
//      lands later) — that beats OS detection and must persist
//      across launches.
//   2. The user previously logged in and apps/api delivered a
//      preference (#425). Until the next online launch reads the
//      preference back, the cache reflects the last-active value so
//      Turkish users don't see an English flash.
//
// Storage: expo-secure-store, mirroring the mode-preference store
// (`apps/mobile/src/features/mode-select/mode-preference.ts`). The
// data isn't sensitive, but using the same backing store keeps the
// dependency footprint identical.

import * as SecureStore from 'expo-secure-store';

import { isSupportedLocale, type SupportedLocale } from '@glaon/core/i18n';

const STORAGE_KEY = 'glaon.locale';

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export interface LocaleCache {
  read(): Promise<SupportedLocale | null>;
  write(locale: SupportedLocale): Promise<void>;
  clear(): Promise<void>;
}

export const expoLocaleCache: LocaleCache = {
  async read(): Promise<SupportedLocale | null> {
    let raw: string | null;
    try {
      raw = await SecureStore.getItemAsync(STORAGE_KEY, SECURE_STORE_OPTIONS);
    } catch {
      return null;
    }
    if (raw === null) return null;
    return isSupportedLocale(raw) ? raw : null;
  },
  async write(locale: SupportedLocale): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, locale, SECURE_STORE_OPTIONS);
    } catch {
      /* SecureStore is best-effort — losing the cache means the next
         cold start re-detects from the OS, which is the desired
         degradation. */
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
