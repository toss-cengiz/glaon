// Shared prop contract for the country-flag component. Mirrors the
// app/brand registry shape (`className`, `aria-*`) so Glaon icon
// consumers reach for the same surface across registries.

/** Region taxonomy used by the catalog filter. UN regional split. */
export type FlagRegion = 'africa' | 'americas' | 'asia' | 'europe' | 'oceania' | 'antarctic';

/**
 * ISO 3166-1 alpha-2 country code (lowercase). `flag-icons` accepts
 * additional subnational codes (e.g. `gb-eng`); typed as a generic
 * `string` here so consumers can opt into them without the type
 * narrowing in the way.
 */
export type FlagCountry = string;

export interface FlagIconProps {
  /** ISO 3166-1 alpha-2 country code (case-insensitive). */
  country: FlagCountry;
  /**
   * Visual aspect ratio.
   * - `rectangle` (default) — 4:3 banner.
   * - `square` — 1:1 with full-bleed flag artwork.
   * - `circle` — 1:1 cropped to a circle (typical for avatar / list-item glyphs).
   * @default 'rectangle'
   */
  shape?: 'rectangle' | 'square' | 'circle';
  /** Tailwind override hook. Default size matches `Icon` primitives (size-5). */
  className?: string;
  /**
   * Accessible label. When set, the flag is announced to screen
   * readers; otherwise it's marked decorative (`aria-hidden`) so
   * paired text labels carry the meaning.
   */
  'aria-label'?: string;
}

export interface FlagCatalogEntry {
  /** ISO 3166-1 alpha-2 code, lowercase. */
  code: string;
  /** English country name (matching ISO 3166 short name where applicable). */
  name: string;
  /** Native country name (Turkish for TR, etc.) — falls back to English. */
  nativeName?: string;
  /** UN region. */
  region: FlagRegion;
}
