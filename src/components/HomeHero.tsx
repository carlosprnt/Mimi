import React from 'react';
import { StyleSheet, View } from 'react-native';
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
import { useEffect } from 'react';
import { colors, fonts, spacing } from '@/theme';
import { Card } from './Card';
import { Text } from './Text';
import { ProgressBar } from './ProgressBar';
import { Recommendation } from '@/logic/recommendation';

interface HomeHeroProps {
  recommendation: Recommendation;
  iconName: keyof typeof Ionicons.glyphMap;
  remainingLabel?: string;
}

const GLOW_SIZE = 220;

const HeroGlow: React.FC = () => {
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

  return (
    <Animated.View pointerEvents="none" style={[styles.glow, animStyle]}>
      <Svg width={GLOW_SIZE} height={GLOW_SIZE}>
        <Defs>
          <RadialGradient
            id="hero-glow"
            cx={GLOW_SIZE / 2}
            cy={GLOW_SIZE / 2}
            rx={GLOW_SIZE / 2}
            ry={GLOW_SIZE / 2}
            fx={GLOW_SIZE / 2}
            fy={GLOW_SIZE / 2}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#D8C8FF" stopOpacity="0.32" />
            <Stop offset="0.4" stopColor="#A8A5E6" stopOpacity="0.14" />
            <Stop offset="0.75" stopColor="#A8A5E6" stopOpacity="0.04" />
            <Stop offset="1" stopColor="#A8A5E6" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle
          cx={GLOW_SIZE / 2}
          cy={GLOW_SIZE / 2}
          r={GLOW_SIZE / 2}
          fill="url(#hero-glow)"
        />
      </Svg>
    </Animated.View>
  );
};

export const HomeHero: React.FC<HomeHeroProps> = ({
  recommendation,
  iconName,
  remainingLabel,
}) => {
  const isSleeping = recommendation.state === 'sleeping';
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
      <HeroGlow />
      <View style={styles.iconWrap}>
        <Ionicons name={iconName} size={26} color="#F4F1FF" />
      </View>

      <Text variant="eyebrow" tone="tertiary" style={styles.eyebrow}>
        {recommendation.eyebrow}
      </Text>
      <Text style={styles.primary} numberOfLines={1} adjustsFontSizeToFit>
        {recommendation.primary}
      </Text>
      {recommendation.supporting ? (
        <Text variant="callout" tone="secondary" style={styles.supporting}>
          {recommendation.supporting}
        </Text>
      ) : null}

      {showProgress ? (
        <View style={styles.progressWrap}>
          <ProgressBar value={progressValue} />
          {remainingLabel ? (
            <Text variant="footnote" tone="secondary" style={styles.remaining}>
              {remainingLabel}
            </Text>
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
  card: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    minHeight: 220,
  },
  glow: {
    position: 'absolute',
    top: -90,
    right: -90,
  },
  iconWrap: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
  },
  eyebrow: {
    marginBottom: spacing.sm,
  },
  primary: {
    fontFamily: fonts.medium,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1,
    color: '#F4F1FF',
  },
  supporting: {
    marginTop: spacing.sm,
  },
  progressWrap: {
    marginTop: spacing.lg,
  },
  remaining: {
    marginTop: spacing.sm,
  },
  context: {
    marginTop: spacing.md,
  },
});
