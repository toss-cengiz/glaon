// Internal helper — the canonical "file with corner fold" silhouette
// + a colored extension band at the bottom. Every per-extension
// glyph in the registry composes this primitive with its
// extension code + category color. Lives under a leading
// underscore so import-resolution treats it as private to the
// registry (the package barrel doesn't re-export `_*`).

import type { FileTypeIconProps } from './types';

interface FileShapeProps extends FileTypeIconProps {
  /** Extension label rendered in the bottom band (e.g. `PDF`, `DOCX`). */
  extension: string;
  /** Band background colour — typically per-category (red for archive, blue for document, …). */
  bandColor: string;
  /** Extension text colour — defaults to white for high-contrast bands. */
  textColor?: string;
}

export function FileShape({
  extension,
  bandColor,
  textColor = '#FFFFFF',
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: FileShapeProps) {
  return (
    <svg viewBox="0 0 32 40" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      {/* File body — outline with corner fold. The folded corner is
          drawn as a small triangle with the page-fold visible as a
          subtle shadow. */}
      <path
        d="M5 3 a2 2 0 0 1 2 -2 h14 l8 8 v28 a2 2 0 0 1 -2 2 H7 a2 2 0 0 1 -2 -2 Z"
        fill="#FFFFFF"
        stroke="#D1D5DB"
        strokeWidth="0.75"
      />
      <path d="M21 1 v6 a2 2 0 0 0 2 2 h6" fill="none" stroke="#D1D5DB" strokeWidth="0.75" />
      <path d="M21 1 l8 8 H23 a2 2 0 0 1 -2 -2 Z" fill="#F3F4F6" />
      {/* Extension band */}
      <rect x="5" y="22" width="22" height="10" rx="1.5" fill={bandColor} />
      <text
        x="16"
        y="29"
        textAnchor="middle"
        fontSize="6"
        fontWeight="900"
        fill={textColor}
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.05"
      >
        {extension}
      </text>
    </svg>
  );
}

/**
 * Per-category band palette. Picking the canonical "data colour"
 * for each file family keeps a directory listing scannable —
 * users learn the colour grammar (`blue = document`, `green =
 * spreadsheet`) and identify file types at a glance.
 */
export const CATEGORY_BAND = {
  archive: '#DC2626', // red-600
  audio: '#A855F7', // purple-500
  code: '#0EA5E9', // sky-500
  document: '#2563EB', // blue-600
  image: '#10B981', // emerald-500
  other: '#6B7280', // gray-500
  presentation: '#F97316', // orange-500
  spreadsheet: '#16A34A', // green-600
  video: '#EC4899', // pink-500
} as const;
