// Klarna BNPL glyph. Multi-color brand mark — ships fixed brand
// fills (canonical Klarna-pink surface + black "Klarna" wordmark)
// per Klarna's brand-CTA spec.

import type { PaymentIconProps } from '../types';

export function Klarna({ className, 'aria-hidden': ariaHidden = true, ...rest }: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#FFA8CD" />
      <text
        x="16"
        y="16"
        textAnchor="middle"
        fontSize="6"
        fontWeight="800"
        fill="#000000"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.1"
      >
        Klarna.
      </text>
    </svg>
  );
}
