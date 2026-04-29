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

interface DotSpec {
  id: number;
  leftPct: number;
  topPct: number;
  size: number;
  delay: number;
  cycle: number;
  peak: number;
}

interface SparklesProps {
  /** When true the field renders and animates; switching to false unmounts it. */
  active: boolean;
  count?: number;
  color?: string;
}

const SIZE_BUCKET = [1, 1, 2, 2, 2, 4];

const pickSize = () => SIZE_BUCKET[Math.floor(Math.random() * SIZE_BUCKET.length)];

/**
 * A sparse field of tiny twinkling dots (1 / 2 / 4 px) that flicker
 * around the parent. The parent should `position: 'relative'` and
 * leave a few pixels of bleed for the dots that fall on the edges.
 */
export const Sparkles: React.FC<SparklesProps> = ({
  active,
  count = 14,
  color = 'rgba(255,255,255,0.9)',
}) => {
  const dots: DotSpec[] = useMemo(() => {
    if (!active) return [];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      leftPct: Math.random() * 100,
      topPct: Math.random() * 100,
      size: pickSize(),
      delay: Math.random() * 1500,
      cycle: 700 + Math.random() * 700,
      peak: 0.55 + Math.random() * 0.45,
    }));
  }, [active, count]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={styles.field}>
      {dots.map((d) => (
        <Twinkle key={d.id} spec={d} color={color} />
      ))}
    </View>
  );
};

const Twinkle: React.FC<{ spec: DotSpec; color: string }> = ({ spec, color }) => {
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
          withTiming(spec.peak, { duration: spec.cycle / 2 }),
          withTiming(0, { duration: spec.cycle / 2 }),
        ),
        -1,
        false,
      ),
    );
  }, [spec.delay, spec.cycle, spec.peak, scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.dotWrap,
        {
          left: `${spec.leftPct}%`,
          top: `${spec.topPct}%`,
          width: spec.size,
          height: spec.size,
          marginLeft: -spec.size / 2,
          marginTop: -spec.size / 2,
        },
        animStyle,
      ]}
    >
      <View
        style={{
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          backgroundColor: color,
        }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  field: {
    position: 'absolute',
    top: -8,
    left: -10,
    right: -10,
    bottom: -8,
  },
  dotWrap: {
    position: 'absolute',
  },
});
