// Google Pay digital-wallet glyph. Multi-color brand mark — ships
// fixed brand fills (canonical white surface + Google four-color G
// + "Pay" wordmark in dark text) per Google's brand-CTA spec.

import type { PaymentIconProps } from '../types';

export function GooglePay({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="0.5" />
      <text
        x="6"
        y="15.5"
        fontSize="6"
        fontWeight="500"
        fill="#5F6368"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.1"
      >
        G Pay
      </text>
    </svg>
  );
}
