import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts, spacing } from '@/theme';
import { Card } from './Card';
import { Text } from './Text';

interface StatCardProps {
  eyebrow: string;
  value: string;
  caption?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconTone?: 'accent' | 'soft';
  glowPulse?: boolean;
  style?: ViewStyle;
}

const GLOW_SIZE = 180;

const CornerGlow: React.FC<{ tone: 'accent' | 'soft'; pulse: boolean }> = ({
  tone,
  pulse,
}) => {
  const colorStop = tone === 'accent' ? '#D8C8FF' : '#A8A5E6';
  const opacity = useSharedValue(pulse ? 0.55 : 1);

  useEffect(() => {
    if (!pulse) return;
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 5000,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(0.55, {
          duration: 5000,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      -1,
      false,
    );
  }, [pulse, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.glowWrap, animStyle]}>
      <Svg width={GLOW_SIZE} height={GLOW_SIZE}>
        <Defs>
          <RadialGradient
            id="stat-glow"
            cx={GLOW_SIZE / 2}
            cy={GLOW_SIZE / 2}
            rx={GLOW_SIZE / 2}
            ry={GLOW_SIZE / 2}
            fx={GLOW_SIZE / 2}
            fy={GLOW_SIZE / 2}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={colorStop} stopOpacity="0.32" />
            <Stop offset="0.35" stopColor={colorStop} stopOpacity="0.14" />
            <Stop offset="0.7" stopColor={colorStop} stopOpacity="0.04" />
            <Stop offset="1" stopColor={colorStop} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle
          cx={GLOW_SIZE / 2}
          cy={GLOW_SIZE / 2}
          r={GLOW_SIZE / 2}
          fill="url(#stat-glow)"
        />
      </Svg>
    </Animated.View>
  );
};

export const StatCard: React.FC<StatCardProps> = ({
  eyebrow,
  value,
  caption,
  icon,
  iconTone = 'accent',
  glowPulse = false,
  style,
}) => {
  return (
    <Card
      variant="bordered"
      tone="night"
      emphasis="frosted"
      style={[styles.card, style]}
    >
      {icon ? (
        <>
          <CornerGlow tone={iconTone} pulse={glowPulse} />
          <View style={styles.iconWrap}>
            <Ionicons
              name={icon}
              size={22}
              color={iconTone === 'accent' ? '#F4F1FF' : colors.accent.base}
            />
          </View>
        </>
      ) : null}
      <Text variant="eyebrow" tone="tertiary">
        {eyebrow}
      </Text>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {caption ? (
        <Text variant="footnote" tone="secondary" style={styles.caption}>
          {caption}
        </Text>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 132,
  },
  glowWrap: {
    position: 'absolute',
    top: -70,
    right: -70,
  },
  iconWrap: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  value: {
    fontFamily: fonts.medium,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.4,
    marginTop: spacing.sm,
    color: '#F4F1FF',
  },
  caption: {
    marginTop: spacing.xs,
  },
});
