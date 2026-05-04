// Stack Overflow stacked-bars glyph. Single-colour via `currentColor`.
// SocialButton surface uses Stack Overflow's `#F48024` orange bg
// with white glyph (canonical brand pairing).

import type { BrandIconProps } from './types';

export function StackOverflow({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden={ariaHidden}
      className={className}
      {...rest}
    >
      <path d="M17.36 20.2v-5.38h1.79V22H1.81v-7.18H3.6v5.38zM5.37 14.643l8.78 1.83.366-1.75-8.78-1.83zm1.16-4.169 8.13 3.79.755-1.624-8.13-3.81zm2.252-3.974 6.895 5.74 1.144-1.371-6.895-5.74zm4.453-4.247-1.46 1.087 5.348 7.193 1.46-1.086zM5.198 18.395h8.972V16.61H5.198z" />
    </svg>
  );
}
