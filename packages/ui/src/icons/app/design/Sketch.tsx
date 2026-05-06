// Sketch design app glyph. The yellow / orange diamond gemstone is
// Sketch's identity; canonical fills are hard-coded.

import type { AppIconProps } from '../types';

export function Sketch({ className, 'aria-hidden': ariaHidden = true, ...rest }: AppIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden={ariaHidden} className={className} {...rest}>
      <path fill="#FDB300" d="M6 3 12 1.5 18 3l4 5-10 14L2 8Z" />
      <path fill="#EA6C00" d="M6 3 2 8l10 14Z" />
      <path fill="#EA6C00" d="m18 3 4 5-10 14Z" />
      <path fill="#FDAD00" d="m6 3 6-1.5L18 3l-6 5Z" />
      <path fill="#FEEEB7" d="m6 3 6 5-10 0Z" />
      <path fill="#FEEEB7" d="m18 3-6 5 10 0Z" />
    </svg>
  );
}
