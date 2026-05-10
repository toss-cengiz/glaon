// Apps-side companion to `@glaon/core/i18n/ha-bridge` (#426 / i18n-D).
// `fetchHaTranslations` lives in core because the round-trip is pure
// over an HaClient handle; the i18next install step lives here because
// `@glaon/core` doesn't take a runtime dep on i18next (ADR 0004
// platform-agnostic boundary).
//
// HA serves translations as **flat dotted keys** (`component.switch.state.off`
// → 'Off'). i18next's default `keySeparator: '.'` would interpret those
// dots as a nested traversal — `t('component.switch.state.off')` would
// look for `component → switch → state → off`, miss, and return the
// raw key. So `useHaTranslation` flips `keySeparator: false` per call,
// and `installHaResources` stores the dictionary verbatim under the
// `ha` namespace.

import type { i18n } from 'i18next';
import { useTranslation } from 'react-i18next';

const HA_NAMESPACE = 'ha';

export function installHaResources(
  instance: i18n,
  locale: string,
  resources: Readonly<Record<string, string>>,
): void {
  // `deep: true, overwrite: true` — replace the existing bundle
  // wholesale so a locale switch or a reconnect doesn't leave stale
  // entries behind from the prior fetch.
  instance.addResourceBundle(locale, HA_NAMESPACE, resources, true, true);
}

/**
 * Translate an HA-owned key. The flat dotted form HA serves
 * (`component.switch.state.off`) is preserved as-is — we don't
 * traverse it as a nested path.
 */
export function useHaTranslation(): { readonly t: (key: string) => string } {
  const { t } = useTranslation(HA_NAMESPACE);
  return {
    t: (key) => t(key, { keySeparator: false }),
  };
}
