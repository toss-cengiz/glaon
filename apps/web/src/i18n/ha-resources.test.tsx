import { renderHook } from '@testing-library/react';
import i18next, { type i18n } from 'i18next';
import type { ReactNode } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { installHaResources, useHaTranslation } from './ha-resources';

let instance: i18n;

beforeEach(async () => {
  instance = i18next.createInstance();
  await instance.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['translation', 'ha'],
    defaultNS: 'translation',
    resources: { en: { translation: {} }, tr: { translation: {} } },
    interpolation: { escapeValue: false },
    returnNull: false,
  });
});

afterEach(() => {
  for (const lng of instance.languages) {
    if (instance.hasResourceBundle(lng, 'ha')) {
      instance.removeResourceBundle(lng, 'ha');
    }
  }
});

function wrapper({ children }: { readonly children: ReactNode }): ReactNode {
  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}

describe('installHaResources', () => {
  it('stores HA flat keys under the ha namespace verbatim', () => {
    installHaResources(instance, 'en', { 'component.switch.state.off': 'Off' });
    expect(instance.getResourceBundle('en', 'ha')).toEqual({
      'component.switch.state.off': 'Off',
    });
  });

  it('overwrites the bundle on a re-install (locale switch / reconnect)', () => {
    installHaResources(instance, 'en', { k: 'v1' });
    installHaResources(instance, 'en', { k: 'v2', other: 'x' });
    expect(instance.getResourceBundle('en', 'ha')).toEqual({ k: 'v2', other: 'x' });
  });

  it('keeps locales isolated', () => {
    installHaResources(instance, 'en', { k: 'Off' });
    installHaResources(instance, 'tr', { k: 'Kapalı' });
    expect(instance.getResourceBundle('en', 'ha')).toEqual({ k: 'Off' });
    expect(instance.getResourceBundle('tr', 'ha')).toEqual({ k: 'Kapalı' });
  });
});

describe('useHaTranslation', () => {
  it('resolves a flat dotted key via keySeparator: false', () => {
    installHaResources(instance, 'en', {
      'component.switch.state.off': 'Off',
    });
    const { result } = renderHook(() => useHaTranslation(), { wrapper });
    expect(result.current.t('component.switch.state.off')).toBe('Off');
  });

  it('falls back to the raw key when the bundle has no entry', () => {
    const { result } = renderHook(() => useHaTranslation(), { wrapper });
    expect(result.current.t('component.unknown.key')).toBe('component.unknown.key');
  });
});
