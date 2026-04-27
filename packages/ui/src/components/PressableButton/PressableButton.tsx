// RN Button — `Pressable` + `View` + `Text` with a Glaon `useTheme()`-fed
// design token object. Variant matrix mirrors the web `Button`:
// intent (primary | secondary | tertiary | destructive) × size (sm | md |
// lg) × state (default | pressed | disabled | loading).
//
// Tokens are read from the active `<ThemeProvider tokens={tokens}>` —
// consumers import the generated tokens object from
// `@glaon/ui/dist/tokens/rn` and pass it in once at the app shell.

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
} from 'react-native';

import { useTheme } from '../../theme';
import {
  DEFAULT_BUTTON_INTENT,
  DEFAULT_BUTTON_SIZE,
  type ButtonBaseProps,
  type ButtonIntent,
  type ButtonSize,
} from '../Button/Button.types';

export interface PressableButtonProps
  extends ButtonBaseProps, Omit<PressableProps, 'children' | 'style' | 'disabled'> {}

interface PaintTokens {
  base: { white: string };
  neutral: { '300': string; '900': string };
  brand: { '500': string };
  red: { '700': string };
}

interface IntentSurface {
  background: string;
  border: string;
  label: string;
}

function intentSurfaceFor(intent: ButtonIntent, tokens: PaintTokens): IntentSurface {
  switch (intent) {
    case 'primary':
      return {
        background: tokens.brand['500'],
        border: tokens.brand['500'],
        label: tokens.base.white,
      };
    case 'secondary':
      return {
        background: tokens.base.white,
        border: tokens.neutral['300'],
        label: tokens.neutral['900'],
      };
    case 'tertiary':
      return {
        background: 'transparent',
        border: 'transparent',
        label: tokens.brand['500'],
      };
    case 'destructive':
      return {
        background: tokens.red['700'],
        border: tokens.red['700'],
        label: tokens.base.white,
      };
  }
}

const sizePadding: Record<
  ButtonSize,
  {
    paddingVertical: number;
    paddingHorizontal: number;
    fontSize: number;
    minHeight: number;
    spinner: number;
  }
> = {
  sm: { paddingVertical: 4, paddingHorizontal: 10, fontSize: 13, minHeight: 28, spinner: 12 },
  md: { paddingVertical: 8, paddingHorizontal: 14, fontSize: 14, minHeight: 36, spinner: 14 },
  lg: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 16, minHeight: 44, spinner: 16 },
};

export function PressableButton({
  intent = DEFAULT_BUTTON_INTENT,
  size = DEFAULT_BUTTON_SIZE,
  loading = false,
  disabled = false,
  leadingIcon,
  children,
  ...rest
}: PressableButtonProps) {
  const { tokens } = useTheme<PaintTokens>();
  const surface = intentSurfaceFor(intent, tokens);
  const sizing = sizePadding[size];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: surface.background,
          borderColor: surface.border,
          paddingVertical: sizing.paddingVertical,
          paddingHorizontal: sizing.paddingHorizontal,
          minHeight: sizing.minHeight,
        },
        inactive && styles.inactive,
        pressed && !inactive && styles.pressed,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size={sizing.spinner}
          color={surface.label}
          accessibilityLabel="Loading"
        />
      ) : leadingIcon !== undefined ? (
        <View accessibilityElementsHidden style={styles.icon}>
          {leadingIcon}
        </View>
      ) : null}
      <Text style={[styles.label, { color: surface.label, fontSize: sizing.fontSize }]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    columnGap: 8,
  },
  label: {
    fontWeight: '600',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactive: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
});
