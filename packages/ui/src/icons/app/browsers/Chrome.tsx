// Google Chrome browser glyph. Multi-colour by brand spec — the
// four-quadrant red / yellow / green ring around the blue centre is
// Chrome's identity, so the canonical fills are hard-coded and
// `currentColor` is ignored.

import type { AppIconProps } from '../types';

export function Chrome({ className, 'aria-hidden': ariaHidden = true, ...rest }: AppIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden={ariaHidden} className={className} {...rest}>
      <path
        fill="#EA4335"
        d="M12 2C7.91 2 4.39 4.45 2.83 7.96l4.16 7.21A5.18 5.18 0 0 1 12 6.83h9.16C19.5 4.05 16 2 12 2Z"
      />
      <path
        fill="#FBBC04"
        d="M21.16 6.83H12c2.86 0 5.17 2.32 5.17 5.17 0 .91-.24 1.77-.65 2.51l-4.45 7.71a10 10 0 0 0 9.09-15.39Z"
      />
      <path
        fill="#34A853"
        d="M11.99 17.17a5.16 5.16 0 0 1-4.5-2.61L2.83 7.96a10 10 0 0 0 9.21 14.04l4.45-7.71a5.18 5.18 0 0 1-4.5 2.88Z"
      />
      <circle cx="12" cy="12" r="3.5" fill="#4285F4" />
    </svg>
  );
}
