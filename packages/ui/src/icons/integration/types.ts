// Shared prop contract for every integration glyph component.
// Mirrors `BrandIconProps` so the consumer mental model stays
// consistent across icon registries — the `Foundations / *`
// Storybook docs all document the same `className` + `aria-hidden`
// + `aria-label` surface.

import type { ReactNode } from 'react';

export interface IntegrationIconProps {
  /** Tailwind override hook for the rendered `<svg>`. */
  className?: string;
  /**
   * Whether the icon is decorative. Defaults to `true` because
   * integration glyphs are typically paired with a visible name
   * (settings → Integrations row, share-to-X menu); the icon node
   * itself rarely conveys unique meaning. Override to `false` and
   * pair with `aria-label` for standalone usage.
   * @default true
   */
  'aria-hidden'?: boolean;
  /** Accessible label override for standalone usage. */
  'aria-label'?: string;
}

export interface IntegrationIconCatalogEntry {
  /** Stable identifier — kebab-case, matches the export name lowercased. */
  id: string;
  /** Human-readable label rendered in the catalog grid. */
  label: string;
  /** Component to render. */
  Icon: (props: IntegrationIconProps) => ReactNode;
}
