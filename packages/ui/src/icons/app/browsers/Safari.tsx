// Safari browser glyph. Brand identity is the compass needle (red /
// white split) inside a blue ring, so the canonical fills are
// hard-coded.

import type { AppIconProps } from '../types';

export function Safari({ className, 'aria-hidden': ariaHidden = true, ...rest }: AppIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden={ariaHidden} className={className} {...rest}>
      <circle cx="12" cy="12" r="10" fill="#1E90FF" />
      <circle cx="12" cy="12" r="8.2" fill="#F5F5F7" />
      {/* Compass needle: red half pointing NE, white half pointing SW. */}
      <polygon points="12,12 16.5,7.5 13.4,12" fill="#FF3B30" />
      <polygon points="12,12 7.5,16.5 10.6,12" fill="#FFFFFF" stroke="#C7C7CC" strokeWidth="0.3" />
      <circle cx="12" cy="12" r="0.9" fill="#1E90FF" />
    </svg>
  );
}
