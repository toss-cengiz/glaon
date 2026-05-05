// UnionPay card-network glyph. Multi-color brand mark — ships
// fixed brand fills (the canonical tri-tone red / blue / green
// curved bands) per UnionPay's brand-CTA spec.

import type { PaymentIconProps } from '../types';

export function UnionPay({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="0.5" />
      <path d="M9 7 L13 7 L11.5 17 L7.5 17 Z" fill="#E21836" />
      <path d="M14 7 L18 7 L16.5 17 L12.5 17 Z" fill="#00447C" />
      <path d="M19 7 L23 7 L21.5 17 L17.5 17 Z" fill="#007B5F" />
    </svg>
  );
}
