// Mercado Pago regional-rail glyph. Multi-color brand mark —
// ships fixed brand fills (canonical Mercado-blue surface + white
// "Mercado Pago" wordmark) per Mercado's brand-CTA spec.

import type { PaymentIconProps } from '../types';

export function MercadoPago({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#00B1EA" />
      <text
        x="16"
        y="11.5"
        textAnchor="middle"
        fontSize="3.6"
        fontWeight="800"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.05"
      >
        Mercado
      </text>
      <text
        x="16"
        y="17.5"
        textAnchor="middle"
        fontSize="3.6"
        fontWeight="800"
        fill="#FFE600"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.05"
      >
        Pago
      </text>
    </svg>
  );
}
