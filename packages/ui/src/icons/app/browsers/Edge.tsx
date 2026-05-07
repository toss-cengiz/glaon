// Microsoft Edge browser glyph. The blue-green wave swirl is Edge's
// identity; canonical fills are hard-coded. The simplified silhouette
// here trades exact gradient fidelity for clean rendering at icon
// scale.

import type { AppIconProps } from '../types';

export function Edge({ className, 'aria-hidden': ariaHidden = true, ...rest }: AppIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden={ariaHidden} className={className} {...rest}>
      <path
        fill="#0F75BC"
        d="M22 12.04a10 10 0 0 0-19.93-1.05c.32-3.31 3.84-5.4 8.18-5.13 3.36.21 6.13 2.32 6.94 5.55a3.5 3.5 0 0 1-3.4 4.32H7.05a4.5 4.5 0 0 0 7.62 2.4 5.5 5.5 0 0 0 7.33-6.09Z"
      />
      <path
        fill="#34D399"
        d="M2.07 10.99A10 10 0 0 0 12 22a10 10 0 0 0 9.27-6.27 5.93 5.93 0 0 1-7.6 2.94 4.6 4.6 0 0 1-2.6-3.83 5.5 5.5 0 0 1 5.07-5.84 4.5 4.5 0 0 1 4.07 2.6A10 10 0 0 0 2.07 10.99Z"
      />
    </svg>
  );
}
