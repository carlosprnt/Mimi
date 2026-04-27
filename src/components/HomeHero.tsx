import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MoonPhaseGlyph } from './MoonPhaseGlyph';
import { SleepingZzz } from './SleepingZzz';
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
import { useEffect } from 'react';
import { colors, fonts, spacing } from '@/theme';
import { Card } from './Card';
import { Text } from './Text';
import { ProgressBar } from './ProgressBar';
import { ShimmerText } from './ShimmerText';
import { Recommendation } from '@/logic/recommendation';

interface HomeHeroProps {
  recommendation: Recommendation;
  iconName: keyof typeof Ionicons.glyphMap;
  remainingLabel?: string;
  onTarget?: boolean;
}

const GLOW_SIZE = 280;

const HeroGlow: React.FC<{ tint?: 'violet' | 'success' }> = ({
  tint = 'violet',
}) => {
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.55, { duration: 5000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const stops =
    tint === 'success'
      ? [
          { offset: '0', color: '#E8FFEB', opacity: '0.42' },
          { offset: '0.4', color: '#6FCE8C', opacity: '0.18' },
          { offset: '0.75', color: '#6FCE8C', opacity: '0.05' },
          { offset: '1', color: '#6FCE8C', opacity: '0' },
        ]
      : [
          { offset: '0', color: '#D8C8FF', opacity: '0.32' },
          { offset: '0.4', color: '#A8A5E6', opacity: '0.14' },
          { offset: '0.75', color: '#A8A5E6', opacity: '0.04' },
          { offset: '1', color: '#A8A5E6', opacity: '0' },
        ];

  return (
    <Animated.View pointerEvents="none" style={[styles.glow, animStyle]}>
      <Svg width={GLOW_SIZE} height={GLOW_SIZE}>
        <Defs>
          <RadialGradient
            id={`hero-glow-${tint}`}
            cx={GLOW_SIZE / 2}
            cy={GLOW_SIZE / 2}
            rx={GLOW_SIZE / 2}
            ry={GLOW_SIZE / 2}
            fx={GLOW_SIZE / 2}
            fy={GLOW_SIZE / 2}
            gradientUnits="userSpaceOnUse"
          >
            {stops.map((s) => (
              <Stop
                key={s.offset}
                offset={s.offset}
                stopColor={s.color}
                stopOpacity={s.opacity}
              />
            ))}
          </RadialGradient>
        </Defs>
        <Circle
          cx={GLOW_SIZE / 2}
          cy={GLOW_SIZE / 2}
          r={GLOW_SIZE / 2}
          fill={`url(#hero-glow-${tint})`}
        />
      </Svg>
    </Animated.View>
  );
};

export const HomeHero: React.FC<HomeHeroProps> = ({
  recommendation,
  iconName,
  remainingLabel,
  onTarget,
}) => {
  const isSleeping = recommendation.root === 'SLEEPING';
  const progress = recommendation.progress;
  const showProgress =
    !!progress && progress.expectedMs > 0 && isSleeping;
  const progressValue = showProgress
    ? progress!.elapsedMs / progress!.expectedMs
    : 0;

  return (
    <Card
      variant="bordered"
      tone="night"
      emphasis="frosted"
      style={styles.card}
    >
      <HeroGlow tint={onTarget ? 'success' : 'violet'} />
      <View style={styles.iconWrap}>
        {iconName === 'moon' || iconName === 'moon-outline' ? (
          <MoonPhaseGlyph size={28} />
        ) : (
          <Ionicons name={iconName} size={26} color="#F4F1FF" />
        )}
      </View>

      {isSleeping ? (
        <View style={styles.eyebrowRow}>
          <View style={styles.zzzSlot}>
            <SleepingZzz />
          </View>
          <ShimmerText variant="eyebrow" tone="tertiary">
            {recommendation.eyebrow}
          </ShimmerText>
        </View>
      ) : (
        <Text variant="eyebrow" tone="tertiary" style={styles.eyebrow}>
          {recommendation.eyebrow}
        </Text>
      )}
      <Text style={styles.primary} numberOfLines={1} adjustsFontSizeToFit>
        {recommendation.primary}
      </Text>
      {recommendation.supporting ? (
        <Text variant="callout" tone="secondary" style={styles.supporting}>
          {recommendation.supporting}
        </Text>
      ) : null}

      {recommendation.reasoning ? (
        <Text variant="footnote" tone="tertiary" style={styles.reasoning}>
          {recommendation.reasoning}
        </Text>
      ) : null}

      {showProgress ? (
        <View style={styles.progressWrap}>
          <ProgressBar value={progressValue} accent={onTarget ? 'success' : 'violet'} />
          {remainingLabel ? (
            <View style={styles.remainingRow}>
              {onTarget ? (
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={colors.success.base}
                  style={styles.remainingIcon}
                />
              ) : null}
              <Text
                variant="footnote"
                tone={onTarget ? undefined : 'secondary'}
                style={[
                  styles.remaining,
                  onTarget ? styles.remainingSuccess : null,
                ]}
              >
                {remainingLabel}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {recommendation.context ? (
        <Text
          variant="footnote"
          tone={recommendation.contextTone === 'warn' ? 'warn' : 'tertiary'}
          style={styles.context}
        >
          {recommendation.context}
        </Text>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {},
  glow: {
    position: 'absolute',
    top: -130,
    right: -130,
  },
  iconWrap: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
  },
  eyebrow: {
    marginBottom: spacing.sm,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginBottom: spacing.sm,
  },
  zzzSlot: {
    width: 36,
    height: 26,
    position: 'relative',
  },
  primary: {
    fontFamily: fonts.medium,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.4,
    color: '#F4F1FF',
  },
  supporting: {
    marginTop: spacing.sm,
  },
  reasoning: {
    marginTop: spacing.xs,
  },
  progressWrap: {
    marginTop: spacing.lg,
  },
  remainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 6,
  },
  remainingIcon: {
    marginTop: 1,
  },
  remaining: {},
  remainingSuccess: {
    color: colors.success.base,
  },
  context: {
    marginTop: spacing.md,
  },
});
