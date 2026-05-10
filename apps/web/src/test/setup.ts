import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import i18next from 'i18next';
import ICU from 'i18next-icu';
import { initReactI18next } from 'react-i18next';
import { afterEach } from 'vitest';

import en from '../i18n/locales/en.json';
import tr from '../i18n/locales/tr.json';

// Initialize the global i18next instance for tests so components that
// call `useTranslation()` resolve real strings (and probe.toHaveTextContent
// regexes still match on the EN copy). Production wires its own scoped
// instance via `<I18nProvider>` in main.tsx — this default is jsdom-only.
if (!i18next.isInitialized) {
  void i18next
    .use(ICU)
    .use(initReactI18next)
    .init({
      lng: 'en',
      fallbackLng: 'en',
      resources: {
        en: { translation: en },
        tr: { translation: tr },
      },
      interpolation: { escapeValue: false },
      returnNull: false,
    });
}

afterEach(() => {
  cleanup();
});
