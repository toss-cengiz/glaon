// Samsung Pay digital-wallet glyph. Multi-color brand mark — ships
// fixed brand fills (canonical Samsung-blue surface + white
// "SAMSUNG Pay" wordmark) per Samsung's brand-CTA spec.

import type { PaymentIconProps } from '../types';

export function SamsungPay({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#1428A0" />
      <text
        x="16"
        y="11.5"
        textAnchor="middle"
        fontSize="3.6"
        fontWeight="900"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="0.2"
      >
        SAMSUNG
      </text>
      <text
        x="16"
        y="18"
        textAnchor="middle"
        fontSize="4.5"
        fontWeight="500"
        fontStyle="italic"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        Pay
      </text>
    </svg>
  );
}
