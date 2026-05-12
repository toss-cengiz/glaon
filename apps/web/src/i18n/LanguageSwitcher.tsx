// Apps/web user-facing language switcher (#406). Reads + writes the
// active i18next locale; persistence is handled by
// i18next-browser-languagedetector (see `instance.ts`), which writes
// the chosen value to `localStorage[STORAGE_KEY]` so the choice
// survives reloads. apps/api `/me/preferences` write-through lands
// when the auth bridge has a session producer in apps/web — that's a
// follow-up; the localStorage path is enough to close the i18n epic's
// "switch language → reload → preference persists" acceptance.

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { SUPPORTED_LOCALES, isSupportedLocale, type SupportedLocale } from '@glaon/core/i18n';

interface LanguageSwitcherProps {
  /** Optional className for layout placement (header, sidebar, etc.). */
  readonly className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps): ReactNode {
  const { t, i18n } = useTranslation();
  const active = (
    isSupportedLocale(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'en'
  ) satisfies SupportedLocale;

  const options = SUPPORTED_LOCALES.map((code) => ({
    label: t(`languageSwitcher.options.${code}`),
    value: code,
  }));

  return (
    <label className={className} style={{ display: 'inline-flex', flexDirection: 'column' }}>
      <span>{t('languageSwitcher.label')}</span>
      <select
        data-testid="language-switcher"
        aria-label={t('languageSwitcher.ariaLabel')}
        defaultValue={active}
        onChange={(event) => {
          const next = event.target.value;
          if (isSupportedLocale(next)) {
            void i18n.changeLanguage(next);
          }
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
