// Adobe Illustrator glyph. The orange rounded square with white "Ai"
// letterform is Adobe's canonical Illustrator mark.

import type { AppIconProps } from '../types';

export function Illustrator({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: AppIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#330000" />
      <path
        fill="#FF9A00"
        d="M9.85 13.43H6.6l-.66 2.07H4l3.27-9.06h2.32l3.28 9.06h-2.05l-.97-2.07Zm-.45-1.5L8.22 8.4l-1.16 3.53h2.34Zm5.8-4.16a1.07 1.07 0 1 1 0-2.14 1.07 1.07 0 0 1 0 2.14Zm-.93 8.73v-7.13h1.86v7.13h-1.86Z"
      />
    </svg>
  );
}
