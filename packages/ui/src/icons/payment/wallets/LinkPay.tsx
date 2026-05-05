// Link (Stripe's saved-payment wallet) digital-wallet glyph.
// Multi-color brand mark — ships fixed brand fills (canonical
// Link-green surface + dark "link" wordmark) per Stripe's
// Link brand-CTA spec.

import type { PaymentIconProps } from '../types';

export function LinkPay({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#00D66F" />
      <text
        x="16"
        y="16"
        textAnchor="middle"
        fontSize="6"
        fontWeight="800"
        fill="#1F2937"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.1"
      >
        link
      </text>
    </svg>
  );
}
