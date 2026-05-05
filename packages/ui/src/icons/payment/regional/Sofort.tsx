// SOFORT (Klarna's German bank-redirect rail) glyph. Multi-color
// brand mark — ships fixed brand fills (canonical white surface +
// pink "SOFORT" wordmark) per Klarna's brand-CTA spec for the
// SOFORT sub-brand.

import type { PaymentIconProps } from '../types';

export function Sofort({ className, 'aria-hidden': ariaHidden = true, ...rest }: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="0.5" />
      <text
        x="16"
        y="16"
        textAnchor="middle"
        fontSize="6"
        fontWeight="900"
        fill="#EE5C82"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.1"
      >
        SOFORT
      </text>
    </svg>
  );
}
