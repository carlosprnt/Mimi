import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface SparkleSpec {
  id: number;
  leftPct: number;
  topPct: number;
  delay: number;
  size: number;
  cycle: number;
  rotation: number;
}

interface SparklesProps {
  /** When true the field renders and animates; switching to false unmounts it. */
  active: boolean;
  /** Number of sparkles. */
  count?: number;
  color?: string;
}

/**
 * A field of small twinkling stars that appear around its parent for a
 * celebratory effect. The parent should `position: 'relative'` and give
 * this enough room to bleed outside its bounds.
 */
export const Sparkles: React.FC<SparklesProps> = ({
  active,
  count = 10,
  color = '#FFE89F',
}) => {
  const stars: SparkleSpec[] = useMemo(() => {
    if (!active) return [];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      leftPct: Math.random() * 100,
      topPct: Math.random() * 100,
      delay: Math.random() * 1200,
      size: 9 + Math.random() * 13,
      cycle: 700 + Math.random() * 600,
      rotation: Math.random() * 360,
    }));
    // Re-generating on every activation gives a different layout each time.
  }, [active, count]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={styles.field}>
      {stars.map((s) => (
        <SparkleStar key={s.id} spec={s} color={color} />
      ))}
    </View>
  );
};

const SparkleStar: React.FC<{ spec: SparkleSpec; color: string }> = ({
  spec,
  color,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      spec.delay,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: spec.cycle / 2,
            easing: Easing.out(Easing.cubic),
          }),
          withTiming(0, {
            duration: spec.cycle / 2,
            easing: Easing.in(Easing.cubic),
          }),
        ),
        -1,
        false,
      ),
    );
    opacity.value = withDelay(
      spec.delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: spec.cycle / 2 }),
          withTiming(0, { duration: spec.cycle / 2 }),
        ),
        -1,
        false,
      ),
    );
  }, [spec.delay, spec.cycle, scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${spec.rotation}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: `${spec.leftPct}%`,
          top: `${spec.topPct}%`,
          marginLeft: -spec.size / 2,
          marginTop: -spec.size / 2,
        },
        animStyle,
      ]}
    >
      <Ionicons name="sparkles" size={spec.size} color={color} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  field: {
    position: 'absolute',
    top: -16,
    left: -28,
    right: -16,
    bottom: -16,
  },
  star: {
    position: 'absolute',
  },
});
