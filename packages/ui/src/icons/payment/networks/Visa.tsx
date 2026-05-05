// Visa card-network glyph. Multi-color brand mark — ships fixed
// brand fills (canonical Visa-blue surface + white wordmark) per
// Visa's brand-CTA spec. Uses an SVG `<text>` wordmark rendered in
// the host system-ui font for clean cross-platform reproduction
// without shipping bespoke letterform paths (which risk drift
// against Visa's official kit on retina + sub-pixel rendering).

import type { PaymentIconProps } from '../types';

export function Visa({ className, 'aria-hidden': ariaHidden = true, ...rest }: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#1A1F71" />
      <text
        x="16"
        y="15.5"
        textAnchor="middle"
        fontSize="6"
        fontWeight="900"
        fontStyle="italic"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="0.4"
      >
        VISA
      </text>
    </svg>
  );
}
