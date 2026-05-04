// Sparkles emoji — three four-pointed stars. Ships fixed gold fill
// for the celebratory connotation.

import type { EmojiIconProps } from './types';

export function Sparkles({ className, 'aria-hidden': ariaHidden = true, ...rest }: EmojiIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <path d="M12 2 13.5 7.5 19 9 13.5 10.5 12 16 10.5 10.5 5 9 10.5 7.5 12 2Z" fill="#FACC15" />
      <path
        d="M19 13 19.75 15.25 22 16 19.75 16.75 19 19 18.25 16.75 16 16 18.25 15.25 19 13Z"
        fill="#FACC15"
      />
      <path
        d="M5 16 5.75 18.25 8 19 5.75 19.75 5 22 4.25 19.75 2 19 4.25 18.25 5 16Z"
        fill="#FACC15"
      />
    </svg>
  );
}
