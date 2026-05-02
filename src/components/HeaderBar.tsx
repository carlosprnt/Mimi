import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';
import { Text } from './Text';

interface IconAction {
  glyph?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

interface HeaderBarProps {
  title?: string;
  subtitle?: string;
  leading?: IconAction;
  trailing?: IconAction[];
  /** A small secondary label shown on the right (e.g. "1 de 3"). */
  trailingText?: string;
  showWordmark?: boolean;
  /**
   * When provided, the header floats above scroll content with a
   * blurred backdrop that fades in and a title that shrinks slightly
   * as the user scrolls. Screens passing scrollY should drop 'top'
   * from their Screen `edges` and add `paddingTop: useSafeAreaInsets()
   * .top + HEADER_BAR_HEIGHT` on the scroll container.
   */
  scrollY?: SharedValue<number>;
}

/** Bar height excluding the safe-area inset on top. */
export const HEADER_BAR_HEIGHT = 64;

const COLLAPSE_DISTANCE = 80;
const BG_FADE_DISTANCE = 32;
const TITLE_MIN_SCALE = 0.82;

const ActionButton: React.FC<{ action: IconAction }> = ({ action }) => (
  <Pressable
    onPress={action.onPress}
    accessibilityRole="button"
    accessibilityLabel={action.label}
    hitSlop={8}
    style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
  >
    {action.icon ? (
      <Ionicons name={action.icon} size={16} color={colors.accent.base} />
    ) : (
      <Text variant="headline" tone="accent">
        {action.glyph}
      </Text>
    )}
  </Pressable>
);

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  subtitle,
  leading,
  trailing,
  trailingText,
  showWordmark,
  scrollY,
}) => {
  const insets = useSafeAreaInsets();

  const bgAnim = useAnimatedStyle(() => {
    if (!scrollY) return { opacity: 0 };
    const p = interpolate(
      scrollY.value,
      [0, BG_FADE_DISTANCE],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity: p };
  });

  const titleAnim = useAnimatedStyle(() => {
    if (!scrollY) return { transform: [{ scale: 1 }] };
    const p = interpolate(
      scrollY.value,
      [0, COLLAPSE_DISTANCE],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ scale: interpolate(p, [0, 1], [1, TITLE_MIN_SCALE]) }],
    };
  });

  const titleNode = (
    <Animated.View style={titleAnim}>
      {showWordmark ? (
        <Text variant="wordmark" tone="primary">
          MIMI
        </Text>
      ) : title ? (
        <Text variant="headline" tone="primary">
          {title}
        </Text>
      ) : null}
    </Animated.View>
  );

  const inner = (
    <View style={styles.bar}>
      <View style={styles.side}>
        {leading ? <ActionButton action={leading} /> : null}
      </View>

      <View style={styles.center}>
        {titleNode}
        {subtitle ? (
          <Text variant="footnote" tone="secondary" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={[styles.side, styles.sideRight]}>
        {trailingText ? (
          <Text variant="footnote" tone="tertiary" style={styles.trailingText}>
            {trailingText}
          </Text>
        ) : null}
        {(trailing ?? []).map((action) => (
          <ActionButton key={action.label} action={action} />
        ))}
      </View>
    </View>
  );

  if (!scrollY) return inner;

  // Backdrop extends well past the bar so the gradient mask can fade
  // smoothly into the content underneath, mirroring DashboardHeader.
  const backdropHeight = insets.top + HEADER_BAR_HEIGHT + 40;

  return (
    <View
      style={[styles.floating, { paddingTop: insets.top }]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          styles.backdrop,
          { height: backdropHeight },
          bgAnim,
        ]}
        pointerEvents="none"
      >
        <MaskedView
          style={StyleSheet.absoluteFill}
          maskElement={
            <LinearGradient
              colors={[
                'rgba(0,0,0,1)',
                'rgba(0,0,0,0.85)',
                'rgba(0,0,0,0)',
              ]}
              locations={[0, 0.55, 1]}
              style={StyleSheet.absoluteFill}
            />
          }
        >
          <BlurView
            intensity={36}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(11, 20, 54, 0.42)' },
            ]}
          />
        </MaskedView>
      </Animated.View>
      {inner}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    height: HEADER_BAR_HEIGHT,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  floating: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  side: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sideRight: {
    justifyContent: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  subtitle: {
    marginTop: 2,
  },
  trailingText: {
    paddingHorizontal: spacing.sm,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
