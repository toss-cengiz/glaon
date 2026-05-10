// Mobile I18nProvider — runs the full mobile-side fallback chain
// (#431 / i18n-I) on top of the i18next instance from `instance.ts`:
//
//   1. Cached last-active locale (read on mount) — beats the
//      synchronous OS detection so a Turkish user with an explicit
//      preference doesn't see an English flash before the cache
//      lands.
//   2. OS locale via `useLocales()` — re-fires when the user
//      switches the device language while the app is open.
//   3. Negotiator fallback (en) inside `resolveSupportedLocale`.
//
// The negotiator (`@glaon/core/i18n`) keeps an explicit
// `apps/api → HA profile → platform → fallback` precedence; this
// provider only owns the *platform* slot. `apps/api` preference
// integration lands together with the mobile auth bridge wiring
// (separate effort tracked under #392).

import { useLocales } from 'expo-localization';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { createI18n } from './instance';
import { expoLocaleCache, type LocaleCache } from './locale-cache';
import { resolveSupportedLocale } from './native-detector';

interface I18nProviderProps {
  readonly children: ReactNode;
  /** Test seam: swap the cache backend (e.g. an in-memory fake). */
  readonly cache?: LocaleCache;
}

export function I18nProvider({ children, cache = expoLocaleCache }: I18nProviderProps): ReactNode {
  const instance = useMemo(() => createI18n(), []);
  const locales = useLocales();
  const lastApplied = useRef<string | null>(null);

  // Hydrate the cached preference on mount. Runs once; the OS-locale
  // effect below stays the source of truth for runtime changes. We
  // park the `cancelled` flag on a ref so the lint pass doesn't
  // narrow it to the literal-false at the closure-capture site.
  const cancelledRef = useRef(false);
  useEffect(() => {
    cancelledRef.current = false;
    void (async () => {
      const cached = await cache.read();
      if (cancelledRef.current || cached === null) return;
      if (instance.language !== cached) {
        await instance.changeLanguage(cached);
        lastApplied.current = cached;
      }
    })();
    return () => {
      cancelledRef.current = true;
    };
  }, [instance, cache]);

  // OS-locale → i18next bridge. `useLocales()` re-renders the tree
  // whenever the user changes the device language; we re-resolve
  // through `resolveSupportedLocale` and apply if it diverges from
  // the active i18next language.
  useEffect(() => {
    const next = resolveSupportedLocale(locales);
    if (next === lastApplied.current) return;
    if (instance.language === next) {
      lastApplied.current = next;
      return;
    }
    void (async () => {
      await instance.changeLanguage(next);
      lastApplied.current = next;
      await cache.write(next);
    })();
  }, [instance, locales, cache]);

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}
