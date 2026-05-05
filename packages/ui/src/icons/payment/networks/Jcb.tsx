// JCB card-network glyph. Multi-color brand mark — ships fixed
// brand fills (the canonical white surface + tri-tone JCB blocks:
// blue / red / green) per JCB's brand-CTA spec. Each colored
// segment carries its respective letter centred via SVG `<text>`.

import type { PaymentIconProps } from '../types';

export function Jcb({ className, 'aria-hidden': ariaHidden = true, ...rest }: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="0.5" />
      <rect x="6" y="6" width="6" height="12" rx="1.5" fill="#0E4C96" />
      <rect x="13" y="6" width="6" height="12" rx="1.5" fill="#E60039" />
      <rect x="20" y="6" width="6" height="12" rx="1.5" fill="#00A55B" />
      <text
        x="9"
        y="14"
        textAnchor="middle"
        fontSize="5"
        fontWeight="900"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        J
      </text>
      <text
        x="16"
        y="14"
        textAnchor="middle"
        fontSize="5"
        fontWeight="900"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        C
      </text>
      <text
        x="23"
        y="14"
        textAnchor="middle"
        fontSize="5"
        fontWeight="900"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        B
      </text>
    </svg>
  );
}
