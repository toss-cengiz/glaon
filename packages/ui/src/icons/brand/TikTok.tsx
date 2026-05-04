// TikTok music-note glyph. Multi-color brand mark — ships fixed
// brand fills (cyan + magenta + black layers per TikTok's brand
// spec). Place on a contrasting surface; the SocialButton wrap
// pairs it with `bg-utility-neutral-900` so the cyan + magenta
// glow reads against dark bg.

import type { BrandIconProps } from './types';

export function TikTok({ className, 'aria-hidden': ariaHidden = true, ...rest }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <path
        d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05 6.33 6.33 0 0 0-5.31 9.47 6.33 6.33 0 0 0 11.34-3.86V8.79a8.16 8.16 0 0 0 4.77 1.52V6.86a4.85 4.85 0 0 1-1.57-.17z"
        fill="#000"
      />
      <path
        d="M21.16 6.86a4.84 4.84 0 0 1-1-2.74 4.83 4.83 0 0 1-3.78-4.12L13 0v15.53a2.89 2.89 0 0 1-2.89 2.89 2.86 2.86 0 0 1-2.31-1.15 2.89 2.89 0 0 0 2.31 4.64 2.89 2.89 0 0 0 2.89-2.89V3.36h3.45A4.83 4.83 0 0 0 20.18 7.6 4.85 4.85 0 0 0 21.16 6.86z"
        fill="#25F4EE"
      />
      <path
        d="M14.45 7.6V6a8.16 8.16 0 0 0 1.55.13V2.55a4.85 4.85 0 0 0-3.63-2.43V13.31a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 0 2.31 4.64 2.89 2.89 0 0 0 2.89-2.89V8.94a8.16 8.16 0 0 0 4.77 1.52V6.86a4.85 4.85 0 0 1-2.69 0z"
        fill="#FE2C55"
      />
    </svg>
  );
}
