// Shared prop contract for every emoji glyph component. Mirrors
// `BrandIconProps` so the consumer mental model stays consistent
// across icon registries — the `Foundations / *` Storybook docs all
// document the same `className` + `aria-hidden` + `aria-label`
// surface.

import type { ReactNode } from 'react';

export interface EmojiIconProps {
  /** Tailwind override hook for the rendered `<svg>`. */
  className?: string;
  /**
   * Whether the icon is decorative. Defaults to `true` because
   * emoji are typically paired with visible text or used as
   * accent decorations; the icon node itself rarely conveys
   * unique meaning. Override to `false` and pair with
   * `aria-label` for standalone usage (e.g. a reaction picker
   * tile where the emoji *is* the affordance).
   * @default true
   */
  'aria-hidden'?: boolean;
  /** Accessible label override for standalone usage. */
  'aria-label'?: string;
}

export interface EmojiIconCatalogEntry {
  /** Stable identifier — kebab-case, matches the export name lowercased. */
  id: string;
  /** Human-readable label rendered in the catalog grid. */
  label: string;
  /** Component to render. */
  Icon: (props: EmojiIconProps) => ReactNode;
}
