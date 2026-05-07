// Opera browser glyph. Brand identity is the red "O" — solid red
// ring with a white inner cut-out. Canonical fill is hard-coded so
// the glyph reads as Opera regardless of surrounding text colour.

import type { AppIconProps } from '../types';

export function Opera({ className, 'aria-hidden': ariaHidden = true, ...rest }: AppIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden={ariaHidden} className={className} {...rest}>
      <ellipse cx="12" cy="12" rx="10" ry="10" fill="#FF1B2D" />
      <ellipse cx="12" cy="12" rx="3.6" ry="6.6" fill="#FFFFFF" />
    </svg>
  );
}
