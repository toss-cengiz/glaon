// Replit cube-prism glyph. Single-colour via `currentColor`.

import type { IntegrationIconProps } from './types';

export function Replit({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: IntegrationIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden={ariaHidden}
      className={className}
      {...rest}
    >
      <path d="M3 3h9v9H3V3Zm9 9h9v9H12v-9Zm-9 0h9v9H3v-9Z" />
    </svg>
  );
}
