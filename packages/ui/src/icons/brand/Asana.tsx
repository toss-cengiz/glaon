// Asana three-dot mark. Multi-color brand glyph — ships fixed
// brand fills (the canonical red / coral / orange triad) so unlike
// single-colour brand glyphs this does NOT inherit `currentColor`.
// Place on a contrasting surface — the SocialButton wrap pairs it
// with `bg-primary` (white) so the warm-toned mark reads against
// light bg.

import type { BrandIconProps } from './types';

export function Asana({ className, 'aria-hidden': ariaHidden = true, ...rest }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <circle cx="12" cy="15.94" r="5.5" fill="#F06A6A" />
      <circle cx="6.5" cy="6.94" r="5.5" fill="#F06A6A" opacity="0.85" />
      <circle cx="17.5" cy="6.94" r="5.5" fill="#F06A6A" opacity="0.85" />
    </svg>
  );
}
