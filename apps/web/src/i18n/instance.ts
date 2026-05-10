// Web i18n bootstrap per ADR 0023 / #424. Bundles `en` + `tr`
// resources directly via Vite's JSON imports — no http-backend until
// the bundle size warrants lazy-loading per-namespace splits.
//
// Detection order: explicit override (read from localStorage on
// mount) → browser navigator.language → fallback English. The
// localStorage hook is exposed via `setLocaleOverride` for the
// language switcher (ships in a later sub-issue).

import i18next, { type i18n } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ICU from 'i18next-icu';
import { initReactI18next } from 'react-i18next';

import { FALLBACK_LOCALE, SUPPORTED_LOCALES } from '@glaon/core/i18n';

import en from './locales/en.json';
import tr from './locales/tr.json';

const STORAGE_KEY = 'glaon.locale';

// `i18next-browser-languagedetector` persists the chosen locale to
// localStorage via the `caches: ['localStorage']` config below; the
// language switcher (lands with i18n-G) reads/writes the same key.

export function createI18n(): i18n {
  const instance = i18next.createInstance();
  void instance
    .use(ICU)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: FALLBACK_LOCALE,
      supportedLngs: SUPPORTED_LOCALES,
      ns: ['translation'],
      defaultNS: 'translation',
      resources: {
        en: { translation: en },
        tr: { translation: tr },
      },
      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: STORAGE_KEY,
        caches: ['localStorage'],
      },
      interpolation: { escapeValue: false },
      returnNull: false,
    });
  return instance;
}
