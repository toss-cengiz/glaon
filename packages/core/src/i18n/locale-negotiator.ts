// Locale negotiator per ADR 0023 / #424. Pure logic — no DOM, no
// react-native, no i18next imports — so it stays valid under
// `@glaon/core`'s platform-agnostic boundary (ADR 0004).
//
// Precedence chain when resolving the active locale:
//   1. Explicit override (the user picked a language in settings;
//      apps/api persists it once i18n-C lands).
//   2. HA profile language (HA's `language` user attribute, surfaced
//      via the WS connection; wired in i18n-D).
//   3. Platform detection result (browser navigator.language on web,
//      `expo-localization` on mobile).
//   4. Fallback (`en`).
//
// Supported locales are a closed set — anything outside the set
// collapses to its base ('en-US' → 'en') or the fallback. Keeping the
// allowlist explicit prevents fingerprinting + surprises when a new
// browser ships an unknown BCP-47 tag.

export const SUPPORTED_LOCALES = ['en', 'tr'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const FALLBACK_LOCALE: SupportedLocale = 'en';

export interface LocaleNegotiationInput {
  readonly explicit?: string | null | undefined;
  readonly haProfile?: string | null | undefined;
  readonly platformDetection?: string | null | undefined;
}

export function negotiateLocale(input: LocaleNegotiationInput): SupportedLocale {
  return (
    coerce(input.explicit) ??
    coerce(input.haProfile) ??
    coerce(input.platformDetection) ??
    FALLBACK_LOCALE
  );
}

function coerce(candidate: string | null | undefined): SupportedLocale | null {
  if (candidate === null || candidate === undefined || candidate.length === 0) {
    return null;
  }
  const normalized = candidate.toLowerCase().split(/[-_]/)[0];
  if (normalized === undefined) return null;
  for (const supported of SUPPORTED_LOCALES) {
    if (supported === normalized) return supported;
  }
  return null;
}

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  if (typeof value !== 'string') return false;
  for (const supported of SUPPORTED_LOCALES) {
    if (supported === value) return true;
  }
  return false;
}
