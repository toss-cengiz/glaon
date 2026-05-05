// Shared prop contract for every file-type glyph component.
// Mirrors `BrandIconProps` in spirit but uses a 32×40 viewBox by
// default — file glyphs are taller than wide (the canonical "file
// with corner fold" silhouette). Consumers can resize via
// `className` (e.g. `size-8` for square slots, `h-10` to preserve
// the 4:5 ratio).

import type { ReactNode } from 'react';

export interface FileTypeIconProps {
  /** Tailwind override hook for the rendered `<svg>`. */
  className?: string;
  /**
   * Whether the icon is decorative. Defaults to `true` because
   * file-type glyphs typically pair with the visible filename
   * + size, which carry the meaning. Override to `false` and
   * pair with `aria-label` for standalone usage (rare —
   * usually for empty-row "no files yet" affordances).
   * @default true
   */
  'aria-hidden'?: boolean;
  /** Accessible label override for standalone usage. */
  'aria-label'?: string;
}

export type FileTypeCategory =
  | 'archive'
  | 'audio'
  | 'code'
  | 'document'
  | 'image'
  | 'other'
  | 'presentation'
  | 'spreadsheet'
  | 'video';

export interface FileTypeIconCatalogEntry {
  /** Stable identifier — kebab-case extension (e.g. `pdf`, `docx`). */
  id: string;
  /** Human-readable label rendered in the catalog grid. */
  label: string;
  /** Catalog category for filter chips. */
  category: FileTypeCategory;
  /** Component to render. */
  Icon: (props: FileTypeIconProps) => ReactNode;
}
