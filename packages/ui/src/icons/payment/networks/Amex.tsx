// American Express (AMEX) card-network glyph. Ships fixed brand
// fills — the canonical AMEX blue surface (`#006FCF`) with white
// "AMERICAN EXPRESS" wordmark — per AMEX's brand-CTA spec.

import type { PaymentIconProps } from '../types';

export function Amex({ className, 'aria-hidden': ariaHidden = true, ...rest }: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#006FCF" />
      <path
        d="M16 9 L18 9 L19 11 L20 9 L22 9 L20 13 L22 17 L20 17 L19 14.5 L18 17 L16 17 L14 13 Z M10.5 9 L13.5 9 L14 17 L12 17 L11.85 15.5 L10.15 15.5 L10 17 L8 17 Z M11 11 L10.4 14 L11.6 14 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}
