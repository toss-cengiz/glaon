// Clubhouse hand-wave mark. Single-colour via `currentColor`.

import type { BrandIconProps } from './types';

export function Clubhouse({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden={ariaHidden}
      className={className}
      {...rest}
    >
      <path d="M12 0a12 12 0 1 0 12 12A12 12 0 0 0 12 0Zm5.36 13.51a1.51 1.51 0 0 1-1.21 1.49.96.96 0 0 1 .68.92.95.95 0 0 1-.95.95.96.96 0 0 1-.96-.95.95.95 0 0 1 .26-.66 1.5 1.5 0 0 1-1.04-1.42v-.01a1.5 1.5 0 0 1 .26-.85 1.5 1.5 0 0 1-1.04-1.42v-.01a1.5 1.5 0 0 1 1.51-1.5h.16a1.5 1.5 0 0 1 1.5 1.5v.01a1.5 1.5 0 0 1-1.04 1.42 1.5 1.5 0 0 1 1.04 1.42v.01h.83a1.5 1.5 0 0 1-.5-1.13v-.01a1.5 1.5 0 0 1 1.5-1.5h.17a1.5 1.5 0 0 1 1.5 1.5v.01c0 .73-.52 1.34-1.21 1.49a.96.96 0 0 1 .68.92.95.95 0 0 1-.95.95.96.96 0 0 1-.96-.95.95.95 0 0 1 .26-.66 1.5 1.5 0 0 1-1.04-1.42v-.01a1.5 1.5 0 0 1 .26-.85 1.5 1.5 0 0 1-1.04-1.42z" />
    </svg>
  );
}
