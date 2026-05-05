// Zip (formerly Quadpay) BNPL glyph. Multi-color brand mark —
// ships fixed brand fills (canonical Zip-yellow surface + black
// "zip" wordmark) per Zip's brand-CTA spec.

import type { PaymentIconProps } from '../types';

export function Zip({ className, 'aria-hidden': ariaHidden = true, ...rest }: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#1A0826" />
      <text
        x="16"
        y="16"
        textAnchor="middle"
        fontSize="7"
        fontWeight="900"
        fill="#AA8FFF"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.2"
      >
        zip
      </text>
    </svg>
  );
}
