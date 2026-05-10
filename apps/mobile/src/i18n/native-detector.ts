// Native locale detector for mobile (#431 / i18n-I). Thin wrapper
// over `expo-localization`'s `Locale[]` shape — the actual matching
// against Glaon's closed `SupportedLocale` set lives in
// `@glaon/core/i18n` (`resolveFromCandidates`) so web and mobile
// agree on what counts as a match.
//
// The wrapper walks the OS-provided locales list **in priority
// order** (most-preferred first) and emits a flat list of candidate
// strings — both the explicit `languageCode` (e.g. `tr`) and the
// full `languageTag` (e.g. `tr-TR`). The core helper takes the first
// supported hit; a user with `["fr-FR", "tr-TR", "en-US"]` resolves
// to `tr` (we don't fall straight to English because French is
// unsupported).

import { type Locale } from 'expo-localization';

import { resolveFromCandidates, type SupportedLocale } from '@glaon/core/i18n';

export function resolveSupportedLocale(
  locales: readonly Pick<Locale, 'languageCode' | 'languageTag'>[],
): SupportedLocale {
  const candidates: (string | null | undefined)[] = [];
  for (const locale of locales) {
    candidates.push(locale.languageCode, locale.languageTag);
  }
  return resolveFromCandidates(candidates);
}
