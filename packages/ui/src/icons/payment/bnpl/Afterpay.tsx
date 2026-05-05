// Afterpay BNPL glyph. Multi-color brand mark — ships fixed brand
// fills (canonical Afterpay-mint surface + black "Afterpay"
// wordmark) per Afterpay's brand-CTA spec.

import type { PaymentIconProps } from '../types';

export function Afterpay({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#B2FCE4" />
      <text
        x="16"
        y="15.5"
        textAnchor="middle"
        fontSize="4.6"
        fontWeight="800"
        fill="#000000"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.05"
      >
        Afterpay
      </text>
    </svg>
  );
}
