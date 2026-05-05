// American Express card-network glyph. Ships fixed brand fills —
// canonical AMEX blue surface (`#006FCF`) with white "AMEX"
// wordmark. Uses an SVG `<text>` wordmark for clean cross-platform
// reproduction (the official kit ships AMERICAN EXPRESS in two
// lines on full-size cards; the abbreviated AMEX is the canonical
// compact form for icon slots like Glaon's payment-row glyph).

import type { PaymentIconProps } from '../types';

export function Amex({ className, 'aria-hidden': ariaHidden = true, ...rest }: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#006FCF" />
      <text
        x="16"
        y="15.5"
        textAnchor="middle"
        fontSize="6"
        fontWeight="900"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="0.3"
      >
        AMEX
      </text>
    </svg>
  );
}
