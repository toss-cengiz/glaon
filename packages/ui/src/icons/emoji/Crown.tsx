// Crown emoji. Multi-color (gold body + jeweled accents) ships
// fixed brand fills.

import type { EmojiIconProps } from './types';

export function Crown({ className, 'aria-hidden': ariaHidden = true, ...rest }: EmojiIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <path
        d="M3 8l4 5 5-7 5 7 4-5-2 11H5L3 8Z"
        fill="#FACC15"
        stroke="#92400E"
        strokeWidth="0.5"
      />
      <circle cx="3" cy="8" r="1.25" fill="#EF4444" />
      <circle cx="21" cy="8" r="1.25" fill="#EF4444" />
      <circle cx="12" cy="6" r="1.25" fill="#3B82F6" />
    </svg>
  );
}
