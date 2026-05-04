// Fire emoji. Multi-color flame (orange outer + yellow inner) ships
// fixed brand fills.

import type { EmojiIconProps } from './types';

export function Fire({ className, 'aria-hidden': ariaHidden = true, ...rest }: EmojiIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <path
        d="M13.5 0c-.5 4.5-3.5 5-3.5 9 0 1.5.5 2.5.5 2.5S8 11 8 8c0 0-3 3-3 7 0 4.97 4.03 9 9 9s9-4.03 9-9c0-7-5.5-11-9.5-15Z"
        fill="#F97316"
      />
      <path
        d="M14 13c0 1.5-1 2-2 4 0 0 4 0 4-3.5 0-2.5-2-3-2-4.5-1 1-2 2-2 2s1-1 2 2Z"
        fill="#FACC15"
      />
    </svg>
  );
}
