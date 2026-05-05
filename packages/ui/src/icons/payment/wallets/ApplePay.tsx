// Apple Pay digital-wallet glyph. Multi-color brand mark — ships
// fixed brand fills (canonical black surface + white  + Pay
// wordmark) per Apple's brand-CTA spec.

import type { PaymentIconProps } from '../types';

export function ApplePay({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#000000" />
      <text
        x="11.5"
        y="15.5"
        textAnchor="middle"
        fontSize="6"
        fontWeight="900"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
      ></text>
      <text
        x="20"
        y="15.5"
        textAnchor="middle"
        fontSize="5.5"
        fontWeight="700"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.1"
      >
        Pay
      </text>
    </svg>
  );
}
