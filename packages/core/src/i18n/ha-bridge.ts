// HA translations bridge (i18n-D / #426). Glaon never re-translates
// HA-owned content (device class labels, state names, area names,
// service descriptions); we ask HA for them in the active locale via
// `frontend/get_translations` and merge the result into i18next under
// the `ha` namespace. The bridge itself is a pure function over the
// HaClient handshake — the i18next install step lives in the apps so
// this file stays inside `@glaon/core`'s platform-agnostic boundary.
//
// Cache: the bridge keeps an in-memory cache keyed by `${locale}/${category}`.
// Callers wire reconnect-driven invalidation (#10's reconnect lifecycle)
// by passing `{ refresh: true }` — that bypasses the cache and overwrites
// the entry. The cache lifetime is process-bound on purpose: a long-lived
// HA session with a static locale should fetch once, but a TR-EN switch
// or a reconnect should re-fetch.

import type { HaClient } from '../ha/client';
import type {
  HaGetTranslationsFrame,
  HaTranslationCategory,
  HaTranslationsResult,
} from '../ha/protocol/messages';

export interface FetchHaTranslationsOptions {
  /** HA's translation category. Defaults to `'state'`. */
  readonly category?: HaTranslationCategory;
  /** Bypass + overwrite the cached entry. */
  readonly refresh?: boolean;
  /**
   * Override the cache backend (test seam). The default is a per-bridge
   * Map; pass a fake when reasoning about cache hits in unit tests.
   */
  readonly cache?: HaTranslationsCache;
}

export interface HaTranslationsCache {
  get(key: string): Readonly<Record<string, string>> | undefined;
  set(key: string, value: Readonly<Record<string, string>>): void;
  delete(key: string): void;
  clear(): void;
}

const defaultCache: HaTranslationsCache = (() => {
  const store = new Map<string, Readonly<Record<string, string>>>();
  return {
    get: (key) => store.get(key),
    set: (key, value) => {
      store.set(key, value);
    },
    delete: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
})();

function cacheKey(locale: string, category: HaTranslationCategory): string {
  return `${locale}/${category}`;
}

/**
 * Fetch HA-owned translations for `locale` from a connected HaClient.
 *
 * Returns the flat dotted-key dictionary HA serves on `frontend/get_translations`
 * (e.g. `component.switch.state.off → 'Off'` in English). Caches the result
 * keyed by `${locale}/${category}` so a render path that needs the same
 * pair pays the WS round-trip once. Pass `{ refresh: true }` to force a
 * fresh fetch — the typical caller is the HaClient reconnect listener.
 */
export async function fetchHaTranslations(
  client: HaClient,
  locale: string,
  options: FetchHaTranslationsOptions = {},
): Promise<Readonly<Record<string, string>>> {
  const category: HaTranslationCategory = options.category ?? 'state';
  const cache = options.cache ?? defaultCache;
  const key = cacheKey(locale, category);
  if (options.refresh !== true) {
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
  }
  const frame: Omit<HaGetTranslationsFrame, 'id'> = {
    type: 'frontend/get_translations',
    language: locale,
    category,
  };
  const result = await client.request<HaTranslationsResult>(frame);
  // HA wraps the dictionary in `{ resources: {...} }`. Glaon keeps the
  // flat shape downstream so the i18next install side never has to
  // unwrap.
  const resources = result.resources ?? {};
  cache.set(key, resources);
  return resources;
}

/**
 * Drop a single locale/category pair from the cache. Wire this into
 * the HaClient reconnect listener (or call directly when the user
 * switches language) so the next fetch hits HA.
 */
export function invalidateHaTranslations(
  locale: string,
  options: { category?: HaTranslationCategory; cache?: HaTranslationsCache } = {},
): void {
  const category: HaTranslationCategory = options.category ?? 'state';
  const cache = options.cache ?? defaultCache;
  cache.delete(cacheKey(locale, category));
}

/**
 * Drop every cached locale/category pair. Useful on app-wide auth
 * resets or test isolation.
 */
export function clearHaTranslationsCache(cache: HaTranslationsCache = defaultCache): void {
  cache.clear();
}
