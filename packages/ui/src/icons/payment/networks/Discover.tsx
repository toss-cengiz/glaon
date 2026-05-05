// Discover card-network glyph. Multi-color brand mark — ships
// fixed brand fills (white surface + Discover orange wordmark +
// the canonical orange dot) per Discover's brand-CTA spec.
// Uses a centred `<text>` wordmark with Discover's brand orange
// accent dot replacing the `O`-as-globe in the official mark
// (close enough for a 32×24 icon slot; full kit-art reproduces
// the globe pictogram which doesn't read at this scale).

import type { PaymentIconProps } from '../types';

export function Discover({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="0.5" />
      <text
        x="16"
        y="14"
        textAnchor="middle"
        fontSize="3.6"
        fontWeight="800"
        fill="#1F2937"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="0.15"
      >
        DISCOVER
      </text>
      <circle cx="16" cy="18" r="1.8" fill="#FF6000" />
    </svg>
  );
}
