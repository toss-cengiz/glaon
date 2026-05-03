// Shared prop contract for every brand glyph component. We don't
// extend `SVGProps<SVGSVGElement>` directly because we want to keep
// the surface narrow — only `className` and `aria-*` flow through.
// Internal multi-colour brands (Figma, Google) ignore `currentColor`
// and ship explicit fills for their canonical brand colours; the
// surrounding button text colour does NOT recolour them.

import type { ReactNode } from 'react';

export interface BrandIconProps {
  /** Tailwind override hook for the rendered `<svg>`. */
  className?: string;
  /**
   * Whether the icon is decorative. Defaults to `true` because brand
   * glyphs are paired with a visible label or a parent button's
   * `aria-label`; the icon node itself rarely conveys unique meaning.
   * @default true
   */
  'aria-hidden'?: boolean;
  /** Accessible label override for standalone usage (no surrounding label). */
  'aria-label'?: string;
}

export interface BrandIconCatalogEntry {
  /** Stable identifier — kebab-case, matches the export name lowercased. */
  id: string;
  /** Human-readable label rendered in the catalog grid. */
  label: string;
  /** Component to render. */
  Icon: (props: BrandIconProps) => ReactNode;
}
