// Sparkling heart emoji — pink heart with two yellow sparkle
// accents. Multi-color glyph; ships fixed brand fills.

import type { EmojiIconProps } from './types';

export function HeartSparkle({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: EmojiIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <path
        d="M11.5 18 0-1.32C5.4 13.36 2 10.28 2 6.5 2 3.42 4.42 1 7.5 1c1.74 0 3.41.81 4.5 2.09C13.09 1.81 14.76 1 16.5 1 19.58 1 22 3.42 22 6.5c0 3.78-3.4 6.86-8.55 11.54L11.5 18Z"
        fill="#EC4899"
      />
      <path
        d="M19.5 17.5 1.2 1.2-1.2 1.2-1.2-1.2 1.2-1.2-1.2-1.2 1.2 1.2 1.2-1.2-1.2 1.2Z"
        fill="#FACC15"
      />
      <path
        d="M5 19 1.5 1.5-1.5 1.5-1.5-1.5 1.5-1.5-1.5-1.5 1.5 1.5 1.5-1.5-1.5 1.5Z"
        fill="#FACC15"
      />
    </svg>
  );
}
