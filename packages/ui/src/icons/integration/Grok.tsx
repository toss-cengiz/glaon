// Grok (xAI) X-mark glyph. Single-colour via `currentColor`.

import type { IntegrationIconProps } from './types';

export function Grok({
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
      <path d="M3 3h2.5l5 7L15.5 3H18l-6.5 9 7 9h-2.5l-5.5-7-5.5 7H3l7-9L3 3Z" />
    </svg>
  );
}
