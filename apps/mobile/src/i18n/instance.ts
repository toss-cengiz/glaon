// Mobile i18n bootstrap per ADR 0023 / #424. Bundles `en` + `tr`
// resources directly — no http backend on mobile (the bundle ships
// them and an OTA update from EAS swaps them whole). `expo-localization`
// surfaces the device's preferred locales so we don't fight the OS.

import { getLocales } from 'expo-localization';
import i18next, { type i18n } from 'i18next';
import ICU from 'i18next-icu';
import { initReactI18next } from 'react-i18next';

import { FALLBACK_LOCALE, SUPPORTED_LOCALES, negotiateLocale } from '@glaon/core/i18n';

import en from './locales/en.json';
import tr from './locales/tr.json';

function detectFromOs(): string | null {
  const locales = getLocales();
  if (locales.length === 0) return null;
  return locales[0].languageCode ?? null;
}

export function createI18n(): i18n {
  const instance = i18next.createInstance();
  void instance
    .use(ICU)
    .use(initReactI18next)
    .init({
      lng: negotiateLocale({ platformDetection: detectFromOs() }),
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
