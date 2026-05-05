// iDEAL (Dutch banking rail) glyph. Multi-color brand mark —
// ships fixed brand fills (canonical white surface + iDEAL-pink
// "iDEAL" wordmark) per the iDEAL brand-CTA spec.

import type { PaymentIconProps } from '../types';

export function Ideal({ className, 'aria-hidden': ariaHidden = true, ...rest }: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="0.5" />
      <text
        x="16"
        y="16"
        textAnchor="middle"
        fontSize="6.4"
        fontWeight="800"
        fill="#CC0066"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.1"
      >
        iDEAL
      </text>
    </svg>
  );
}
