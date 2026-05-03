// Apple wordmark glyph. `currentColor` so the surrounding control's
// text colour drives the fill — used by `SocialButton brand="apple"`
// and any future Apple-Sign-In affordance.

import type { BrandIconProps } from './types';

export function Apple({ className, 'aria-hidden': ariaHidden = true, ...rest }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden={ariaHidden}
      className={className}
      {...rest}
    >
      <path d="M17.535 12.625c.024-2.612 2.13-3.873 2.226-3.93-1.213-1.77-3.099-2.013-3.766-2.038-1.601-.162-3.124.943-3.937.943-.812 0-2.062-.92-3.388-.895-1.745.025-3.354 1.013-4.252 2.572-1.812 3.143-.464 7.793 1.301 10.34.86 1.247 1.886 2.652 3.232 2.602 1.296-.052 1.787-.84 3.354-.84 1.567 0 2.011.84 3.39.812 1.396-.025 2.282-1.275 3.137-2.526.985-1.451 1.392-2.85 1.417-2.924-.031-.014-2.722-1.046-2.748-4.116Zm-2.594-7.55c.715-.866 1.197-2.069 1.066-3.27-1.029.041-2.275.685-3.013 1.55-.661.766-1.241 1.989-1.084 3.166 1.151.089 2.315-.585 3.031-1.446Z" />
    </svg>
  );
}
