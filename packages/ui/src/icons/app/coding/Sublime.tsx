// Sublime Text editor glyph. The orange "S" with stacked angled
// stripes is Sublime's identity; canonical fills are hard-coded.

import type { AppIconProps } from '../types';

export function Sublime({ className, 'aria-hidden': ariaHidden = true, ...rest }: AppIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden={ariaHidden} className={className} {...rest}>
      <path fill="#FF9800" d="m20.55 5.85-.05-3.45L3.5 7.85v3.49l13.42-3.71v3.13Z" />
      <path
        fill="#FF6F00"
        d="m20.5 11.65-13.42 3.7v3.13L20.5 14.78v3.42l-17 5.4v-3.49l13.42-3.7v-3.13L3.5 16.4v-3.49l13.42-3.71V6.07l-13.42 3.7-.05-.04 17.05-5.27v3.45L7.08 11.62l13.42-3.7v3.73Z"
      />
    </svg>
  );
}
