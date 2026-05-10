// Shared i18n contract types per ADR 0023. The core package stays
// platform-agnostic so it doesn't ship the i18next runtime — that
// lives in apps/web and apps/mobile. These types describe the inputs
// to the platform-specific factories so app code shares one surface.

import type { SupportedLocale } from './locale-negotiator';

interface NestedI18nResource {
  readonly [key: string]: string | NestedI18nResource;
}

export type I18nResource = Readonly<Record<string, string | NestedI18nResource>>;

export type I18nNamespaces = Readonly<Record<string, I18nResource>>;

export type I18nResources = Readonly<Record<string, I18nNamespaces>>;

export type LocaleChoice = SupportedLocale | 'system';
