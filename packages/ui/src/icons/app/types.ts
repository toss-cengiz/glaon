// Shared prop contract for every app-icon component. Mirrors
// `BrandIconProps` (`packages/ui/src/icons/brand/types.ts`) so
// consumers reach for the same narrow API regardless of which
// registry the glyph comes from.

import type { ReactNode } from 'react';

export interface AppIconProps {
  /** Tailwind override hook for the rendered `<svg>`. */
  className?: string;
  /**
   * Whether the icon is decorative. Defaults to `true` because app
   * glyphs are paired with a visible label or a parent button's
   * `aria-label`.
   * @default true
   */
  'aria-hidden'?: boolean;
  /** Accessible label override for standalone usage. */
  'aria-label'?: string;
}

/** Stable taxonomy that drives the Storybook catalog filter. */
export type AppIconCategory =
  | 'browsers'
  | 'coding'
  | 'design'
  | 'finance'
  | 'messengers'
  | 'music'
  | 'os'
  | 'other'
  | 'productivity'
  | 'social-networks'
  | 'video';

export interface AppIconCatalogEntry {
  /** Stable identifier — kebab-case, matches the export name lowercased. */
  id: string;
  /** Human-readable label rendered in the catalog grid. */
  label: string;
  /** Category used by the catalog filter. */
  category: AppIconCategory;
  /** Component to render. */
  Icon: (props: AppIconProps) => ReactNode;
}
