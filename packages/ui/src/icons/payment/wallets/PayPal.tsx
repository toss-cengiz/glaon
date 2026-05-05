// PayPal digital-wallet glyph. Multi-color brand mark — ships
// fixed brand fills (canonical white surface + PayPal blue + light
// blue "PayPal" wordmark) per PayPal's brand-CTA spec.

import type { PaymentIconProps } from '../types';

export function PayPal({ className, 'aria-hidden': ariaHidden = true, ...rest }: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="0.5" />
      <text
        x="6"
        y="15.5"
        fontSize="5.6"
        fontWeight="800"
        fontStyle="italic"
        fill="#003087"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.15"
      >
        Pay
      </text>
      <text
        x="16.5"
        y="15.5"
        fontSize="5.6"
        fontWeight="800"
        fontStyle="italic"
        fill="#009CDE"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.15"
      >
        Pal
      </text>
    </svg>
  );
}
