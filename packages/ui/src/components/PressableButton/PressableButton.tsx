import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

export type PressableButtonVariant = 'primary' | 'secondary';
export type PressableButtonSize = 'sm' | 'md' | 'lg';

export interface PressableButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  variant?: PressableButtonVariant;
  size?: PressableButtonSize;
  children: ReactNode;
}

export function PressableButton({
  variant = 'primary',
  size = 'md',
  disabled,
  children,
  ...rest
}: PressableButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        disabled === true && styles.disabled,
        pressed && !(disabled === true) && styles.pressed,
      ]}
      {...rest}
    >
      <Text style={[styles.label, styles[`${variant}Label`]]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  primary: {
    backgroundColor: '#2563eb',
  },
  secondary: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
  },
  sm: { paddingVertical: 4, paddingHorizontal: 10 },
  md: { paddingVertical: 8, paddingHorizontal: 14 },
  lg: { paddingVertical: 12, paddingHorizontal: 20 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  label: {
    fontWeight: '600',
    fontSize: 14,
  },
  primaryLabel: { color: '#ffffff' },
  secondaryLabel: { color: '#111827' },
});
