// JCB card-network glyph. Multi-color brand mark — ships fixed
// brand fills (the canonical white surface + tri-tone JCB blocks:
// blue / red / green) per JCB's brand-CTA spec.

import type { PaymentIconProps } from '../types';

export function Jcb({ className, 'aria-hidden': ariaHidden = true, ...rest }: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="0.5" />
      <rect x="7" y="8" width="5" height="8" rx="1.5" fill="#0E4C96" />
      <rect x="13.5" y="8" width="5" height="8" rx="1.5" fill="#E60039" />
      <rect x="20" y="8" width="5" height="8" rx="1.5" fill="#00A55B" />
      <text x="9" y="13.5" fontSize="2.5" fontWeight="700" fill="#FFFFFF" fontFamily="system-ui">
        J
      </text>
      <text x="15.5" y="13.5" fontSize="2.5" fontWeight="700" fill="#FFFFFF" fontFamily="system-ui">
        C
      </text>
      <text x="22" y="13.5" fontSize="2.5" fontWeight="700" fill="#FFFFFF" fontFamily="system-ui">
        B
      </text>
    </svg>
  );
}
