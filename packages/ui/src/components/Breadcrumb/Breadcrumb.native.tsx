// React Native counterpart of the web Breadcrumb wrap. Per CLAUDE.md's UUI Source Rule,
// the RN-side hand-roll carve-out applies because no Untitled UI source ships for React
// Native — the kit only generates DOM / RAC. Issue #240 picked the "native back button +
// screen header" pattern over a horizontal trail; iOS / Android stack navigators surface
// the parent route via this exact shape (UINavigationBar / Material Toolbar).
//
// The web Breadcrumb expresses a hierarchy by stringing item segments together; the RN
// counterpart expresses the same notion by pointing at the previous level (back) and
// naming the current one (title). Props that don't translate one-to-one (`type`,
// `divider`, `maxVisibleItems`) live only on the web wrap. The intersection — `title` /
// `subtitle` / `onBack` / `backLabel` — is what RN consumers actually need.

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme';

interface BreadcrumbNativeProps {
  /** Current screen title — the equivalent of the last `<Breadcrumb.Item>` on web. */
  readonly title: string;
  /** Optional second line, often used for the parent screen name on iOS-style headers. */
  readonly subtitle?: string;
  /**
   * Tapping the back affordance fires this callback. Omit it on root screens; the back
   * button hides automatically and only the title renders.
   */
  readonly onBack?: () => void;
  /** Accessibility label for the back button. Defaults to "Back". */
  readonly backLabel?: string;
}

interface BreadcrumbNativeTokens {
  readonly textStrong: string;
  readonly textMuted: string;
  readonly backTint: string;
  readonly pressedBg: string;
}

const DEFAULT_TOKENS: BreadcrumbNativeTokens = {
  textStrong: '#0a0d12',
  textMuted: '#475467',
  backTint: '#0a0d12',
  pressedBg: '#0a0d121a',
};

export function BreadcrumbNative({
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
}: BreadcrumbNativeProps): ReactNode {
  const theme = useTheme<{ breadcrumbNative?: Partial<BreadcrumbNativeTokens> }>();
  const tokens: BreadcrumbNativeTokens = {
    ...DEFAULT_TOKENS,
    ...theme.tokens.breadcrumbNative,
  };

  return (
    <View accessibilityRole="header" style={styles.row} testID="breadcrumb-native">
      {onBack !== undefined && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          onPress={onBack}
          testID="breadcrumb-native-back"
          hitSlop={8}
          style={({ pressed }) => [
            styles.backButton,
            pressed && { backgroundColor: tokens.pressedBg },
          ]}
        >
          <Text style={[styles.backGlyph, { color: tokens.backTint }]}>‹</Text>
        </Pressable>
      )}
      <View style={styles.titleColumn}>
        <Text
          accessibilityRole="text"
          numberOfLines={1}
          style={[styles.title, { color: tokens.textStrong }]}
        >
          {title}
        </Text>
        {subtitle !== undefined && (
          <Text
            accessibilityRole="text"
            numberOfLines={1}
            style={[styles.subtitle, { color: tokens.textMuted }]}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    marginRight: 4,
  },
  backGlyph: {
    fontSize: 28,
    lineHeight: 28,
    fontWeight: '300',
  },
  titleColumn: {
    flexShrink: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
});
