// Apps/mobile in-app language switcher (#406). Two-button segmented
// control that flips i18next + persists via the locale-cache (#431).
//
// Mobile doesn't have a native `<select>` we'd want to drop in mid-page
// — the platform pickers (iOS Picker / Android Picker) take a full
// modal sheet, which is overkill for a closed 2-locale set. Two
// Pressable buttons with an active-state ring give the user a
// one-tap path and stay on-page.
//
// Persistence: `i18n.changeLanguage(next)` updates the active locale
// in the i18next instance; the I18nProvider's `useLocales()` effect
// path (`apps/mobile/src/i18n/I18nProvider.tsx`) writes through to
// the cache on the next OS-locale tick. To make the switch
// immediately persistent we also call `cache.write(next)` here — the
// next cold start reads it back and beats the OS-locale fallback per
// the negotiator precedence chain.

import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SUPPORTED_LOCALES, isSupportedLocale, type SupportedLocale } from '@glaon/core/i18n';

import { expoLocaleCache, type LocaleCache } from './locale-cache';

interface LanguageSwitcherProps {
  /** Test seam — swap the cache backend for an in-memory fake. */
  readonly cache?: LocaleCache;
}

export function LanguageSwitcher({ cache = expoLocaleCache }: LanguageSwitcherProps): ReactNode {
  const { t, i18n } = useTranslation();
  const active = (
    isSupportedLocale(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'en'
  ) satisfies SupportedLocale;

  const pick = (next: SupportedLocale): void => {
    if (next === active) return;
    void i18n.changeLanguage(next);
    void cache.write(next);
  };

  return (
    <View testID="language-switcher" accessibilityLabel={t('languageSwitcher.ariaLabel')}>
      <Text style={styles.label}>{t('languageSwitcher.label')}</Text>
      <View style={styles.row}>
        {SUPPORTED_LOCALES.map((code) => {
          const isActive = code === active;
          return (
            <Pressable
              key={code}
              testID={`language-switcher-option-${code}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              onPress={() => {
                pick(code);
              }}
              style={[styles.option, isActive ? styles.optionActive : null]}
            >
              <Text style={[styles.optionText, isActive ? styles.optionTextActive : null]}>
                {t(`languageSwitcher.options.${code}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0d7de',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionActive: {
    borderColor: '#1a73e8',
    backgroundColor: '#e8f0fe',
  },
  optionText: {
    fontSize: 14,
    color: '#5b6770',
  },
  optionTextActive: {
    color: '#1a73e8',
    fontWeight: '600',
  },
});
