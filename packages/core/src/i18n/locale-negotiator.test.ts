import { describe, expect, it } from 'vitest';

import {
  FALLBACK_LOCALE,
  isSupportedLocale,
  negotiateLocale,
  resolveFromCandidates,
} from './locale-negotiator';

describe('negotiateLocale', () => {
  it('returns the explicit choice when set to a supported value', () => {
    expect(negotiateLocale({ explicit: 'tr', haProfile: 'en', platformDetection: 'en' })).toBe(
      'tr',
    );
  });

  it('falls through to HA profile when explicit is null/empty', () => {
    expect(negotiateLocale({ explicit: null, haProfile: 'tr-TR' })).toBe('tr');
    expect(negotiateLocale({ explicit: '', haProfile: 'tr' })).toBe('tr');
  });

  it('falls through to platform detection when both explicit + HA are missing', () => {
    expect(negotiateLocale({ platformDetection: 'en-US' })).toBe('en');
  });

  it('returns the fallback when nothing matches', () => {
    expect(negotiateLocale({})).toBe(FALLBACK_LOCALE);
    expect(negotiateLocale({ explicit: 'fr' })).toBe(FALLBACK_LOCALE);
    expect(negotiateLocale({ platformDetection: 'de-CH' })).toBe(FALLBACK_LOCALE);
  });

  it('normalizes locale tags case-insensitively + strips region', () => {
    expect(negotiateLocale({ explicit: 'TR' })).toBe('tr');
    expect(negotiateLocale({ explicit: 'EN_us' })).toBe('en');
  });

  it('skips an unknown candidate and tries the next layer', () => {
    expect(negotiateLocale({ explicit: 'fr', haProfile: 'tr', platformDetection: 'en' })).toBe(
      'tr',
    );
  });
});

describe('isSupportedLocale', () => {
  it('accepts only the closed set', () => {
    expect(isSupportedLocale('en')).toBe(true);
    expect(isSupportedLocale('tr')).toBe(true);
    expect(isSupportedLocale('TR')).toBe(false);
    expect(isSupportedLocale('fr')).toBe(false);
    expect(isSupportedLocale(null)).toBe(false);
    expect(isSupportedLocale(undefined)).toBe(false);
    expect(isSupportedLocale({})).toBe(false);
  });
});

describe('resolveFromCandidates', () => {
  it('returns the first supported candidate from a priority list', () => {
    expect(resolveFromCandidates(['fr-FR', 'tr-TR', 'en-US'])).toBe('tr');
    expect(resolveFromCandidates(['en-GB', 'tr-TR'])).toBe('en');
  });

  it('walks past null / empty entries', () => {
    expect(resolveFromCandidates([null, undefined, '', 'tr'])).toBe('tr');
  });

  it('falls back when nothing matches', () => {
    expect(resolveFromCandidates(['fr-FR', 'es-ES', 'ja-JP'])).toBe(FALLBACK_LOCALE);
    expect(resolveFromCandidates([])).toBe(FALLBACK_LOCALE);
  });

  it('matches both language codes and full BCP 47 tags', () => {
    expect(resolveFromCandidates(['tr'])).toBe('tr');
    expect(resolveFromCandidates(['EN_us'])).toBe('en');
  });
});
