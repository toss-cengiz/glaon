// Outline star emoji. Ships hollow stroke for the canonical
// "unrated" state in star-rating UIs.

import type { EmojiIconProps } from './types';

export function StarOutline({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: EmojiIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <path
        d="m12 17.27 6.18 3.73-1.64-7.03 5.46-4.73-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21l6.18-3.73Z"
        stroke="#A3A3A3"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
