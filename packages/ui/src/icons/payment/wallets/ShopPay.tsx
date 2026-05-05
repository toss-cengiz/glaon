// Shop Pay digital-wallet glyph. Multi-color brand mark — ships
// fixed brand fills (canonical Shop-purple surface + white "Shop"
// wordmark + "Pay" sub-mark) per Shopify's brand-CTA spec.

import type { PaymentIconProps } from '../types';

export function ShopPay({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#5A31F4" />
      <text
        x="16"
        y="15.5"
        textAnchor="middle"
        fontSize="5"
        fontWeight="800"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.05"
      >
        shop Pay
      </text>
    </svg>
  );
}
