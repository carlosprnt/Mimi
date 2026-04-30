import React, { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type StreakColor = 'white' | 'yellow';
type ExitMode = 'fade' | 'scale';

interface Streak {
  id: number;
  /** Pixel coords for the spawn point. */
  startX: number;
  startY: number;
  /** Travel vector. */
  dx: number;
  dy: number;
  /** Lifetime in ms. */
  duration: number;
  /** Dot diameter in px. */
  size: number;
  color: StreakColor;
  exit: ExitMode;
}

interface ShootingStarsProps {
  /** Average gap between shooting-star events (ms). Each event may
   *  spawn 1 or 2 streaks. */
  intervalMs?: number;
}

const COLORS: Record<StreakColor, string> = {
  white: '#FFFFFF',
  yellow: '#FFE48A',
};

const pickColor = (): StreakColor =>
  Math.random() < 0.7 ? 'white' : 'yellow';

const pickExit = (): ExitMode => (Math.random() < 0.5 ? 'fade' : 'scale');

const randomDirection = (): { dx: number; dy: number } => {
  // Bias the angle toward the lower hemisphere (so dots feel like they
  // fall) but with full 360° randomness, capped distance.
  const angle = (Math.random() * 2 - 1) * Math.PI; // -π..π
  return { dx: Math.cos(angle), dy: Math.sin(angle) };
};

/**
 * Subtle background effect: small white (and occasionally yellow) dots
 * that sweep diagonally across the screen and fade out — some by
 * fading opacity, some by scaling to 0. Every spawn cycle has a chance
 * of emitting two streaks at once (always one white + one yellow) in
 * separate positions and travelling in different directions.
 */
export const ShootingStars: React.FC<ShootingStarsProps> = ({
  intervalMs = 3500,
}) => {
  const { width, height } = useWindowDimensions();
  const [streaks, setStreaks] = useState<Streak[]>([]);

  useEffect(() => {
    let id = 0;
    const buildStreak = (color: StreakColor): Streak => {
      id += 1;
      const startX = Math.random() * width * 0.85 + width * 0.05;
      const startY = Math.random() * height * 0.6 + height * 0.05;
      const { dx, dy } = randomDirection();
      const distance = width * (0.35 + Math.random() * 0.4);
      return {
        id,
        startX,
        startY,
        dx: dx * distance,
        dy: dy * distance,
        duration: 1100 + Math.random() * 900,
        size: 2 + Math.random() * 2.5, // 2.0 – 4.5 px
        color,
        exit: pickExit(),
      };
    };

    const spawn = () => {
      const next: Streak[] = [];
      // 35% of spawns emit a paired yellow+white streak together, in
      // their own positions and own directions.
      if (Math.random() < 0.35) {
        next.push(buildStreak('white'));
        next.push(buildStreak('yellow'));
      } else {
        next.push(buildStreak(pickColor()));
      }
      setStreaks((prev) => [...prev, ...next]);
      // Cleanup once the longest of the spawn group is done animating.
      const longest = Math.max(...next.map((s) => s.duration));
      setTimeout(() => {
        const ids = new Set(next.map((s) => s.id));
        setStreaks((prev) => prev.filter((s) => !ids.has(s.id)));
      }, longest + 200);
    };

    // First star slightly delayed so it doesn't fight the screen mount.
    const initial = setTimeout(spawn, 1100);
    const tick = setInterval(spawn, intervalMs);
    return () => {
      clearTimeout(initial);
      clearInterval(tick);
    };
  }, [width, height, intervalMs]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {streaks.map((s) => (
        <Streak key={s.id} streak={s} />
      ))}
    </View>
  );
};

const Streak: React.FC<{ streak: Streak }> = ({ streak }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: streak.duration,
      easing: Easing.out(Easing.quad),
    });
  }, [progress, streak.duration]);

  const animStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const tx = streak.dx * t;
    const ty = streak.dy * t;
    // Fade in over the first ~12% of the lifetime, then linear fade
    // out the rest of the way for the 'fade' exit. The 'scale' exit
    // keeps full opacity until the very end and shrinks instead.
    const fadeIn = Math.min(1, t / 0.12);
    const opacity =
      streak.exit === 'fade'
        ? fadeIn * (1 - Math.max(0, (t - 0.12) / 0.88))
        : fadeIn * (t < 0.85 ? 1 : 1 - (t - 0.85) / 0.15);
    const scale =
      streak.exit === 'scale'
        ? 1 - Math.max(0, (t - 0.55) / 0.45)
        : 1;
    return {
      opacity,
      transform: [
        { translateX: tx },
        { translateY: ty },
        { scale },
      ],
    };
  });

  const color = COLORS[streak.color];
  const halo =
    streak.color === 'yellow'
      ? 'rgba(255, 228, 138, 0.85)'
      : 'rgba(255, 255, 255, 0.85)';

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.dotWrap,
        {
          left: streak.startX,
          top: streak.startY,
          width: streak.size,
          height: streak.size,
          borderRadius: streak.size / 2,
          backgroundColor: color,
          shadowColor: halo,
        },
        animStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  dotWrap: {
    position: 'absolute',
    shadowOpacity: 0.95,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
});
