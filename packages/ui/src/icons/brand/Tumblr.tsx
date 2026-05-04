// Tumblr `t` glyph. Single-colour via `currentColor`. SocialButton
// surface uses Tumblr's `#36465D` navy bg with white glyph.

import type { BrandIconProps } from './types';

export function Tumblr({ className, 'aria-hidden': ariaHidden = true, ...rest }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden={ariaHidden}
      className={className}
      {...rest}
    >
      <path d="M14.563 24c-5.093 0-7.031-3.756-7.031-6.411V9.747H5.116V6.648c3.63-1.313 4.512-4.596 4.71-6.469.018-.13.124-.179.184-.179h3.495v6.097h4.781v3.65h-4.766v7.24c.007 1.038.351 2.395 2.412 2.348.567-.014 1.317-.169 1.706-.349l1.156 3.443c-.485.288-2.215.927-3.769.974-.116.014-.224.018-.262 0z" />
    </svg>
  );
}
