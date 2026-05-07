// Brave browser glyph. The orange shield silhouette is Brave's
// identity; canonical fill is hard-coded. Simplified shield outline
// is sufficient at icon scale.

import type { AppIconProps } from '../types';

export function Brave({ className, 'aria-hidden': ariaHidden = true, ...rest }: AppIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden={ariaHidden} className={className} {...rest}>
      <path
        fill="#FB542B"
        d="M19.6 5.83 17.94 4l-3.06.5L12 3l-2.88 1.5L6.06 4 4.4 5.83l.66 1.83-.85 2.42 2.43 8.85L12 22l5.36-3.07 2.43-8.85-.85-2.42.66-1.83Z"
      />
      <path
        fill="#FFFFFF"
        d="M14.45 12.45 12 11.36l-2.45 1.09 1.39 1.79-.49 2.5L12 18l1.55-1.26-.49-2.5 1.39-1.79Z"
      />
    </svg>
  );
}
