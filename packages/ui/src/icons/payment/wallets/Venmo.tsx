// Venmo digital-wallet glyph. Multi-color brand mark — ships fixed
// brand fills (canonical Venmo-blue surface + white wordmark) per
// Venmo's brand-CTA spec.

import type { PaymentIconProps } from '../types';

export function Venmo({ className, 'aria-hidden': ariaHidden = true, ...rest }: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#3D95CE" />
      <text
        x="16"
        y="16"
        textAnchor="middle"
        fontSize="6"
        fontWeight="900"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.1"
      >
        venmo
      </text>
    </svg>
  );
}
