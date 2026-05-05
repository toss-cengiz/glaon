// Bancontact (Belgian banking rail) glyph. Multi-color brand
// mark — ships fixed brand fills (canonical white surface +
// blue + yellow "Bancontact" wordmark) per Bancontact's brand-CTA
// spec.

import type { PaymentIconProps } from '../types';

export function Bancontact({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="0.5" />
      <text
        x="11"
        y="15.5"
        fontSize="4.6"
        fontWeight="800"
        fill="#005AC2"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.1"
      >
        Banc
      </text>
      <text
        x="20"
        y="15.5"
        fontSize="4.6"
        fontWeight="800"
        fill="#FFD800"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.1"
      >
        ontact
      </text>
    </svg>
  );
}
