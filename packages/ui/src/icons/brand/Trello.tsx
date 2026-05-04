// Trello board glyph — the canonical two-list-stack inside a rounded
// rectangle frame. Single-colour via `currentColor`. SocialButton
// surface treatment uses Trello's brand-blue (`#0079BF` ≈
// `utility-blue-700`) so the white-on-blue glyph reads correctly.

import type { BrandIconProps } from './types';

export function Trello({ className, 'aria-hidden': ariaHidden = true, ...rest }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden={ariaHidden}
      className={className}
      {...rest}
    >
      <path d="M21.147 0H2.853A2.86 2.86 0 0 0 0 2.853v18.294A2.86 2.86 0 0 0 2.853 24h18.294A2.86 2.86 0 0 0 24 21.147V2.853A2.86 2.86 0 0 0 21.147 0ZM10.42 18.231a.93.93 0 0 1-.93.93H4.34a.93.93 0 0 1-.93-.93V4.34a.93.93 0 0 1 .93-.93h5.151a.93.93 0 0 1 .93.93v13.891Zm10.17-6.196a.93.93 0 0 1-.93.93h-5.15a.93.93 0 0 1-.93-.93V4.34a.93.93 0 0 1 .93-.93h5.15a.93.93 0 0 1 .93.93v7.696Z" />
    </svg>
  );
}
