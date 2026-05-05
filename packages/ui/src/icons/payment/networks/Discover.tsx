// Discover card-network glyph. Multi-color brand mark — ships
// fixed brand fills (white surface + Discover orange wordmark
// + the canonical orange circle) per Discover's brand-CTA spec.

import type { PaymentIconProps } from '../types';

export function Discover({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="0.5" />
      <path d="M0 16 L32 16 L32 21 a3 3 0 0 1 -3 3 L3 24 a3 3 0 0 1 -3 -3 Z" fill="#FF6000" />
      <text x="6" y="14" fontSize="3" fontWeight="700" fill="#1F2937" fontFamily="system-ui">
        DISCOVER
      </text>
      <circle cx="22" cy="12" r="2.6" fill="#FF6000" />
    </svg>
  );
}
