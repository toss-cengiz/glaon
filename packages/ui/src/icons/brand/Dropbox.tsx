// Dropbox box mark. Single-colour via `currentColor`. The brand
// surface in SocialButton is Dropbox's `#0061FF` (≈ utility-blue-700)
// so the glyph reads white against the brand bg.

import type { BrandIconProps } from './types';

export function Dropbox({ className, 'aria-hidden': ariaHidden = true, ...rest }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden={ariaHidden}
      className={className}
      {...rest}
    >
      <path d="M6 1.5 0 5.345 6 9.19l6-3.845L18 9.19l6-3.845L18 1.5l-6 3.845L6 1.5Zm0 11.5L0 9.155 6 5.31l6 3.845L6 13Zm6 0 6-3.845L24 13l-6 3.845L12 13Zm0 0L6 9.155 12 5.31l6 3.845L12 13Zm.005 8.654L6.005 17.81l-6-3.845-.005-.005L6 18.31l6 3.844 6-3.844 6.005-4.35-.005.005-6 3.845-6 3.844Z" />
    </svg>
  );
}
