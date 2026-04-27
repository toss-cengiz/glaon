// Shared button contract. The DOM (`Button`) and RN (`PressableButton`)
// implementations both extend this shape with platform-specific event
// handlers and host props.

import type { ReactNode } from 'react';

export type ButtonIntent = 'primary' | 'secondary' | 'tertiary' | 'destructive';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonBaseProps {
  intent?: ButtonIntent;
  size?: ButtonSize;
  /** Show a spinner instead of (or alongside) the label. Disables interaction
   * for the duration; the consumer's click/press handler is suppressed. */
  loading?: boolean;
  disabled?: boolean;
  /** Decorative icon rendered before the label. Pass any node — emoji,
   * inline SVG, or an icon component. Hidden during `loading`. */
  leadingIcon?: ReactNode;
  children: ReactNode;
}

/** Default intent applied when `intent` is omitted. */
export const DEFAULT_BUTTON_INTENT: ButtonIntent = 'primary';

/** Default size applied when `size` is omitted. */
export const DEFAULT_BUTTON_SIZE: ButtonSize = 'md';
