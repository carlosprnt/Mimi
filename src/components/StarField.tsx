import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

interface StarFieldProps {
  density?: number;
  seed?: number;
  twinkle?: boolean;
  style?: ViewStyle;
  heightFraction?: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  group: 0 | 1 | 2;
}

const mulberry32 = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const buildStars = (count: number, seed: number, heightFraction: number): Star[] => {
  const rand = mulberry32(seed);
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const sizeRoll = rand();
    const size = sizeRoll < 0.78 ? 1.2 : sizeRoll < 0.94 ? 2 : 2.8;
    const baseOpacity = 0.5 + rand() * 0.45;
    stars.push({
      x: rand(),
      y: rand() * heightFraction,
      size,
      baseOpacity,
      group: Math.floor(rand() * 3) as 0 | 1 | 2,
    });
  }
  return stars;
};

export const StarField: React.FC<StarFieldProps> = ({
  density = 110,
  seed = 7,
  twinkle = true,
  style,
  heightFraction = 0.65,
}) => {
  const stars = useMemo(
    () => buildStars(density, seed, heightFraction),
    [density, seed, heightFraction],
  );

  const phase0 = useSharedValue(1);
  const phase1 = useSharedValue(1);
  const phase2 = useSharedValue(1);

  React.useEffect(() => {
    if (!twinkle) return;
    const loop = (
      sv: SharedValue<number>,
      duration: number,
      dim: number,
      delay: number,
    ) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(dim, { duration, easing: Easing.inOut(Easing.quad) }),
            withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
          ),
          -1,
          false,
        ),
      );
    };
    loop(phase0, 2600, 0.35, 0);
    loop(phase1, 3400, 0.25, 900);
    loop(phase2, 4000, 0.45, 1800);
  }, [twinkle, phase0, phase1, phase2]);

  const group0Style = useAnimatedStyle(() => ({ opacity: phase0.value }));
  const group1Style = useAnimatedStyle(() => ({ opacity: phase1.value }));
  const group2Style = useAnimatedStyle(() => ({ opacity: phase2.value }));
  const groupStyles = [group0Style, group1Style, group2Style];

  return (
    <View pointerEvents="none" style={[styles.field, style]}>
      {stars.map((star, i) => (
        <Animated.View
          key={i}
          style={[
            styles.star,
            {
              left: `${star.x * 100}%`,
              top: `${star.y * 100}%`,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              backgroundColor: `rgba(221, 229, 255, ${star.baseOpacity.toFixed(3)})`,
            },
            twinkle ? groupStyles[star.group] : undefined,
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
  },
});
