// MasterCard card-network glyph. Multi-color brand mark — ships
// fixed brand fills (the canonical interlocking red + yellow
// circles + white surface) per MasterCard's brand-CTA spec.

import type { PaymentIconProps } from '../types';

export function Mastercard({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="0.5" />
      <circle cx="13" cy="12" r="5" fill="#EB001B" />
      <circle cx="19" cy="12" r="5" fill="#F79E1B" />
      <path
        d="M16 7.5c1.16 1.04 1.92 2.7 1.92 4.5S17.16 15.46 16 16.5C14.84 15.46 14.08 13.8 14.08 12S14.84 8.54 16 7.5Z"
        fill="#FF5F00"
      />
    </svg>
  );
}
