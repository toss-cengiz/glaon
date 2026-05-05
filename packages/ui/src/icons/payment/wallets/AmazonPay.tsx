// Amazon Pay digital-wallet glyph. Multi-color brand mark — ships
// fixed brand fills (canonical white surface + Amazon-orange
// "amazon pay" wordmark) per Amazon's brand-CTA spec.

import type { PaymentIconProps } from '../types';

export function AmazonPay({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="0.5" />
      <text
        x="16"
        y="13.5"
        textAnchor="middle"
        fontSize="4.4"
        fontWeight="700"
        fill="#1F2937"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.05"
      >
        amazon
      </text>
      <text
        x="16"
        y="19"
        textAnchor="middle"
        fontSize="4"
        fontWeight="700"
        fill="#FF9900"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        pay
      </text>
    </svg>
  );
}
