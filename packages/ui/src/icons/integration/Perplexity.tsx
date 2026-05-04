// Perplexity asterisk-Q glyph. Single-colour via `currentColor`.

import type { IntegrationIconProps } from './types';

export function Perplexity({
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
      <path d="M12 2 L13.5 8 H20 L14.5 12 L16 19 L12 15 L8 19 L9.5 12 L4 8 H10.5 Z" />
    </svg>
  );
}
