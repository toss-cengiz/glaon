import { describe, expect, it } from 'vitest';

import { UserPreferencesSchema, UserPreferencesUpdateSchema } from './me';

describe('UserPreferencesSchema', () => {
  it('accepts a supported locale', () => {
    expect(UserPreferencesSchema.parse({ locale: 'tr' })).toEqual({ locale: 'tr' });
    expect(UserPreferencesSchema.parse({ locale: 'en' })).toEqual({ locale: 'en' });
  });

  it('accepts null (no preference)', () => {
    expect(UserPreferencesSchema.parse({ locale: null })).toEqual({ locale: null });
  });

  it('rejects unsupported locales', () => {
    expect(UserPreferencesSchema.safeParse({ locale: 'fr' }).success).toBe(false);
    expect(UserPreferencesSchema.safeParse({ locale: 'TR' }).success).toBe(false);
    expect(UserPreferencesSchema.safeParse({ locale: 'en-US' }).success).toBe(false);
  });

  it('requires the locale field to be present', () => {
    expect(UserPreferencesSchema.safeParse({}).success).toBe(false);
  });
});

describe('UserPreferencesUpdateSchema', () => {
  it('accepts a partial update with locale', () => {
    expect(UserPreferencesUpdateSchema.parse({ locale: 'tr' })).toEqual({ locale: 'tr' });
  });

  it('accepts clearing the preference via null', () => {
    expect(UserPreferencesUpdateSchema.parse({ locale: null })).toEqual({ locale: null });
  });

  it('accepts the empty object (no-op update)', () => {
    expect(UserPreferencesUpdateSchema.parse({})).toEqual({});
  });

  it('rejects unsupported locales', () => {
    expect(UserPreferencesUpdateSchema.safeParse({ locale: 'fr' }).success).toBe(false);
  });

  it('rejects unknown extra fields (strict)', () => {
    expect(UserPreferencesUpdateSchema.safeParse({ locale: 'tr', extra: 1 }).success).toBe(false);
  });
});
