import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

interface SparkleBurstProps {
  /** How many sparkles to spawn around the centre. */
  count?: number;
  /** Total time each sparkle lives. */
  duration?: number;
  /** Maximum radial distance a sparkle can travel from centre, in px. */
  maxRadius?: number;
}

interface DotSpec {
  id: number;
  /** Direction (radians) the sparkle flies in. */
  angle: number;
  /** Distance reached at full life. */
  distance: number;
  /** Dot diameter in px. */
  size: number;
  /** Per-dot delay so the cluster doesn't fire as one frame. */
  delay: number;
}

/**
 * A short-lived radial burst of bright white twinkles. Mount once,
 * unmount when done — the parent can force a re-mount by changing
 * the `key` prop to retrigger the burst.
 *
 * Positioned absoluteFill: the burst centre lives at the centre of
 * its parent container.
 */
export const SparkleBurst: React.FC<SparkleBurstProps> = ({
  count = 26,
  duration = 700,
  maxRadius = 160,
}) => {
  const dots: DotSpec[] = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        angle: Math.random() * Math.PI * 2,
        distance: maxRadius * (0.55 + Math.random() * 0.45),
        size: 2 + Math.random() * 3.5,
        delay: Math.random() * 220,
      })),
    [count, maxRadius],
  );

  return (
    <View pointerEvents="none" style={styles.field}>
      {dots.map((d) => (
        <Sparkle key={d.id} spec={d} duration={duration} />
      ))}
    </View>
  );
};

const Sparkle: React.FC<{ spec: DotSpec; duration: number }> = ({
  spec,
  duration,
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      spec.delay,
      withTiming(1, {
        duration,
        easing: Easing.out(Easing.quad),
      }),
    );
  }, [progress, spec.delay, duration]);

  const animStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const tx = Math.cos(spec.angle) * spec.distance * t;
    const ty = Math.sin(spec.angle) * spec.distance * t;
    // Scale: pop up to 1.3 in the first 35%, then fade to 0.
    const scale =
      t < 0.35 ? (t / 0.35) * 1.3 : Math.max(0, 1.3 * (1 - (t - 0.35) / 0.65));
    // Opacity: ease-in-out — fully visible mid-life, fading at edges.
    const opacity =
      t < 0.2
        ? t / 0.2
        : t > 0.7
          ? Math.max(0, 1 - (t - 0.7) / 0.3)
          : 1;
    return {
      transform: [
        { translateX: tx },
        { translateY: ty },
        { scale },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          marginLeft: -spec.size / 2,
          marginTop: -spec.size / 2,
        },
        animStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  field: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
