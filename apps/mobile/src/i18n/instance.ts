// Mobile i18n bootstrap per ADR 0023 / #424. Bundles `en` + `tr`
// resources directly — no http backend on mobile (the bundle ships
// them and an OTA update from EAS swaps them whole). `expo-localization`
// surfaces the device's preferred locales so we don't fight the OS.
//
// First-run locale resolution happens synchronously here so the app
// commits in the right language without an English flash. The full
// fallback chain — explicit user pref → HA profile → OS locale →
// fallback — runs in the I18nProvider, which also wires the
// `useLocales()` hook so a runtime OS-locale change propagates.

import { getLocales } from 'expo-localization';
import i18next, { type i18n } from 'i18next';
import ICU from 'i18next-icu';
import { initReactI18next } from 'react-i18next';

import { FALLBACK_LOCALE, SUPPORTED_LOCALES } from '@glaon/core/i18n';

import en from './locales/en.json';
import tr from './locales/tr.json';
import { resolveSupportedLocale } from './native-detector';

export function createI18n(): i18n {
  const instance = i18next.createInstance();
  void instance
    .use(ICU)
    .use(initReactI18next)
    .init({
      lng: resolveSupportedLocale(getLocales()),
      fallbackLng: FALLBACK_LOCALE,
      supportedLngs: SUPPORTED_LOCALES,
      ns: ['translation'],
      defaultNS: 'translation',
      resources: {
        en: { translation: en },
        tr: { translation: tr },
      },
      interpolation: { escapeValue: false },
      returnNull: false,
    });
  return instance;
}
