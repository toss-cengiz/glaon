// Per-user preferences (i18n-C / #425). The preferences document is the
// long-lived companion to the per-session JWT: it follows the user across
// devices and HA reinstalls (e.g. their chosen UI language).
//
// `locale` is intentionally typed as the closed `SupportedLocale` set
// (mirrors `@glaon/core/i18n`). The server rejects anything outside the
// set with a 400 — we don't store BCP-47 tags we can't actually render.

import { z } from 'zod';

import { SUPPORTED_LOCALES } from '../i18n/locale-negotiator';

export const UserPreferencesSchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES).nullable(),
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export const UserPreferencesUpdateSchema = z
  .object({
    // `null` clears the preference; omitted leaves it untouched. Treating
    // them as distinct lets the language switcher say "follow the
    // device" without changing the rest of the document.
    locale: z.enum(SUPPORTED_LOCALES).nullable().optional(),
  })
  .strict();
export type UserPreferencesUpdate = z.infer<typeof UserPreferencesUpdateSchema>;
