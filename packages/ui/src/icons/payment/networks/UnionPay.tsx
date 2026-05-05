// UnionPay card-network glyph. Multi-color brand mark — ships
// fixed brand fills (the canonical tri-tone red / blue / green
// parallelograms with the UnionPay wordmark beneath) per
// UnionPay's brand-CTA spec.

import type { PaymentIconProps } from '../types';

export function UnionPay({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="0.5" />
      <path d="M11 4 L14 4 L11 14 L8 14 Z" fill="#E21836" />
      <path d="M15 4 L18 4 L15 14 L12 14 Z" fill="#00447C" />
      <path d="M19 4 L22 4 L19 14 L16 14 Z" fill="#007B5F" />
      <text
        x="16"
        y="20"
        textAnchor="middle"
        fontSize="3.6"
        fontWeight="800"
        fill="#1F2937"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="0.1"
      >
        UnionPay
      </text>
    </svg>
  );
}
