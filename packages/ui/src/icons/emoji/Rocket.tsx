// Rocket emoji. Multi-color (white body + red fins + orange flame)
// ships fixed brand fills for the celebratory "launch" connotation.

import type { EmojiIconProps } from './types';

export function Rocket({ className, 'aria-hidden': ariaHidden = true, ...rest }: EmojiIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <path
        d="M12 2c2.5 2 5.5 6 5.5 11l-2 2-7 0-2-2C6.5 8 9.5 4 12 2Z"
        fill="#FAFAFA"
        stroke="#A3A3A3"
        strokeWidth="0.5"
      />
      <circle cx="12" cy="9" r="1.75" fill="#3B82F6" />
      <path d="M6.5 13 5 18 8.5 16Z" fill="#EF4444" />
      <path d="M17.5 13 19 18 15.5 16Z" fill="#EF4444" />
      <path d="M10 17 9 22 11 19.5Z" fill="#F97316" />
      <path d="M14 17 15 22 13 19.5Z" fill="#F97316" />
    </svg>
  );
}
