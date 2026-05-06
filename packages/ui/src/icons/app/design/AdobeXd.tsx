// Adobe XD design app glyph. Purple/pink rounded square with white
// "Xd" letterform is Adobe's canonical brand mark for XD.

import type { AppIconProps } from '../types';

export function AdobeXd({ className, 'aria-hidden': ariaHidden = true, ...rest }: AppIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#2E001E" />
      <path
        fill="#FF26BE"
        d="M9.93 15.5h-2.1l-1.7-3.16-1.7 3.16h-2.1l2.66-4.51-2.5-4.49h2.1l1.55 3.05L7.7 6.5h2.06l-2.5 4.43L9.93 15.5Zm5.07.16c-.86 0-1.55-.27-2.06-.81-.51-.55-.77-1.34-.77-2.36 0-1.1.31-1.97.92-2.6.62-.65 1.45-.97 2.49-.97a2.6 2.6 0 0 1 1.74.59V6.5h1.94v8.92c-.42.13-.85.21-1.27.27a8 8 0 0 1-2.99-.03Zm-.95-3.16c0 .56.13 1 .4 1.32.27.32.65.48 1.16.48a2.4 2.4 0 0 0 1.21-.32v-2.9a2.04 2.04 0 0 0-1.07-.31 1.6 1.6 0 0 0-1.24.5c-.31.34-.46.74-.46 1.23Z"
      />
    </svg>
  );
}
