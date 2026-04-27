// PressableButton — RN counterpart for the kit web Button. Untitled UI Pro
// does not ship a React Native source (the kit is web-only), so per the
// CLAUDE.md UUI Source Rule carve-out this primitive stays hand-rolled —
// but its prop contract mirrors the kit Button (`color`, `size`,
// `iconLeading`, `iconTrailing`, `isDisabled`, `isLoading`,
// `showTextWhileLoading`, `noTextPadding`) so consumers writing
// platform-shared code can swap implementations without touching props.
//
// Visual styling is driven by Glaon's design tokens via `useTheme()` —
// tokens come from F2's `dist/tokens/rn.ts` build output, brand colors
// override UUI defaults the same way the web glaon-overrides.css does.

import { useMemo, type ComponentType, type ReactNode, type SVGProps } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
} from 'react-native';

import { useTheme } from '../../theme';

export type PressableButtonColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'primary-destructive'
  | 'secondary-destructive'
  | 'tertiary-destructive'
  | 'link-color'
  | 'link-gray'
  | 'link-destructive';

export type PressableButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Mirrors `@untitledui/icons` Props (SVGProps widened with color/size).
// PressableButton renders icons via `<Icon color={surface.label}
// size={sizing.iconSize} />`, so any UUI icon — or a hand-rolled one
// with the same shape — slots in.
type IconLeadingComponent = ComponentType<
  SVGProps<SVGSVGElement> & {
    color?: string;
    size?: number;
  }
>;

export interface PressableButtonProps extends Omit<
  PressableProps,
  'children' | 'style' | 'disabled'
> {
  /** Color variant — mirrors the kit web `Button` `color` prop. */
  color?: PressableButtonColor;
  /** Size variant — mirrors the kit web `Button` `size` prop. */
  size?: PressableButtonSize;
  /** Icon component or element rendered before the label. Accepts the
   * kit's `@untitledui/icons` shape (`SVGProps` + `color?` + `size?`). */
  iconLeading?: IconLeadingComponent | ReactNode;
  /** Icon component or element rendered after the label. */
  iconTrailing?: IconLeadingComponent | ReactNode;
  /** Disables the button and shows a disabled state. */
  isDisabled?: boolean;
  /** Shows a loading spinner and disables the button. */
  isLoading?: boolean;
  /** When true, keeps the label visible alongside the loading spinner. */
  showTextWhileLoading?: boolean;
  /** Removes horizontal padding from the text content (link variants). */
  noTextPadding?: boolean;
  children?: ReactNode;
}

interface PaintTokens {
  base: { white: string };
  neutral: {
    '200': string;
    '300': string;
    '600': string;
    '700': string;
    '900': string;
  };
  brand: { '500': string; '600': string };
  red: { '200': string; '600': string; '700': string };
}

interface Surface {
  background: string;
  border: string;
  label: string;
  underline?: boolean;
  noPadding?: boolean;
}

function surfaceFor(color: PressableButtonColor, t: PaintTokens): Surface {
  switch (color) {
    case 'primary':
      return {
        background: t.brand['500'],
        border: t.brand['500'],
        label: t.base.white,
      };
    case 'secondary':
      return {
        background: t.base.white,
        border: t.neutral['300'],
        label: t.neutral['700'],
      };
    case 'tertiary':
      return {
        background: 'transparent',
        border: 'transparent',
        label: t.neutral['600'],
      };
    case 'primary-destructive':
      return {
        background: t.red['700'],
        border: t.red['700'],
        label: t.base.white,
      };
    case 'secondary-destructive':
      return {
        background: t.base.white,
        border: t.red['200'],
        label: t.red['600'],
      };
    case 'tertiary-destructive':
      return {
        background: 'transparent',
        border: 'transparent',
        label: t.red['600'],
      };
    case 'link-color':
      return {
        background: 'transparent',
        border: 'transparent',
        label: t.brand['500'],
        underline: true,
        noPadding: true,
      };
    case 'link-gray':
      return {
        background: 'transparent',
        border: 'transparent',
        label: t.neutral['600'],
        underline: true,
        noPadding: true,
      };
    case 'link-destructive':
      return {
        background: 'transparent',
        border: 'transparent',
        label: t.red['600'],
        underline: true,
        noPadding: true,
      };
  }
}

interface SizeSpec {
  paddingVertical: number;
  paddingHorizontal: number;
  fontSize: number;
  gap: number;
  iconSize: number;
  spinnerSize: number;
  minHeight: number;
}

const SIZE_SPECS: Record<PressableButtonSize, SizeSpec> = {
  xs: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 14,
    gap: 4,
    iconSize: 16,
    spinnerSize: 14,
    minHeight: 28,
  },
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    gap: 4,
    iconSize: 20,
    spinnerSize: 14,
    minHeight: 36,
  },
  md: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    gap: 4,
    iconSize: 20,
    spinnerSize: 14,
    minHeight: 40,
  },
  lg: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    gap: 6,
    iconSize: 20,
    spinnerSize: 16,
    minHeight: 44,
  },
  xl: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    fontSize: 16,
    gap: 6,
    iconSize: 20,
    spinnerSize: 16,
    minHeight: 48,
  },
};

function isComponent(value: PressableButtonProps['iconLeading']): value is IconLeadingComponent {
  return typeof value === 'function';
}

export function PressableButton({
  color = 'primary',
  size = 'sm',
  iconLeading,
  iconTrailing,
  isDisabled = false,
  isLoading = false,
  showTextWhileLoading = false,
  noTextPadding,
  children,
  ...rest
}: PressableButtonProps) {
  const { tokens } = useTheme<PaintTokens>();
  const surface = useMemo(() => surfaceFor(color, tokens), [color, tokens]);
  const sizing = SIZE_SPECS[size];
  const inactive = isDisabled || isLoading;
  const showLabel = !isLoading || showTextWhileLoading;
  const stripPadding = noTextPadding ?? surface.noPadding ?? false;

  const renderIcon = (icon: PressableButtonProps['iconLeading']) => {
    if (icon === undefined || icon === null) return null;
    if (isComponent(icon)) {
      const Icon = icon;
      return <Icon color={surface.label} size={sizing.iconSize} />;
    }
    return <View style={styles.iconWrap}>{icon}</View>;
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: isLoading }}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: surface.background,
          borderColor: surface.border,
          paddingVertical: stripPadding ? 0 : sizing.paddingVertical,
          paddingHorizontal: stripPadding ? 0 : sizing.paddingHorizontal,
          minHeight: stripPadding ? 0 : sizing.minHeight,
          columnGap: sizing.gap,
        },
        inactive && styles.inactive,
        pressed && !inactive && styles.pressed,
      ]}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator
          accessibilityLabel="Loading"
          color={surface.label}
          size={sizing.spinnerSize}
        />
      ) : (
        renderIcon(iconLeading)
      )}
      {showLabel && children !== undefined ? (
        <Text
          style={[
            styles.label,
            {
              color: surface.label,
              fontSize: sizing.fontSize,
              textDecorationLine: surface.underline ? 'underline' : 'none',
            },
          ]}
        >
          {children}
        </Text>
      ) : null}
      {!isLoading ? renderIcon(iconTrailing) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  label: {
    fontWeight: '600',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactive: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
