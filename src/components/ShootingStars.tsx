import React, { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface Streak {
  id: number;
  startX: number;
  startY: number;
  /** Diagonal travel distance in pixels. */
  distance: number;
  /** Angle of travel (radians). Negative slope (down-right). */
  angle: number;
  /** Streak duration in ms. */
  duration: number;
  width: number;
}

interface ShootingStarsProps {
  /** Average gap between shooting stars (ms). */
  intervalMs?: number;
}

/**
 * A subtle background effect: a thin white streak with a fading tail
 * rakes across the screen on a diagonal every ~3.5s, in a different
 * starting position each time.
 */
export const ShootingStars: React.FC<ShootingStarsProps> = ({
  intervalMs = 3500,
}) => {
  const { width, height } = useWindowDimensions();
  const [streaks, setStreaks] = useState<Streak[]>([]);

  useEffect(() => {
    let id = 0;
    const spawn = () => {
      id += 1;
      const startX = Math.random() * width * 0.7 + width * 0.05;
      const startY = Math.random() * height * 0.45 + height * 0.05;
      // Slight angle variance (around 25° to 40° from horizontal).
      const angle = (-(20 + Math.random() * 25) * Math.PI) / 180;
      const distance = width * (0.5 + Math.random() * 0.35);
      const duration = 900 + Math.random() * 500;
      const streak: Streak = {
        id,
        startX,
        startY,
        distance,
        angle,
        duration,
        width: 90 + Math.random() * 60,
      };
      setStreaks((prev) => [...prev, streak]);
      // Remove streak after it animates out so the array stays small.
      setTimeout(() => {
        setStreaks((prev) => prev.filter((s) => s.id !== streak.id));
      }, duration + 200);
    };

    // First star slightly delayed so it doesn't fight the screen mount.
    const initial = setTimeout(spawn, 1200);
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
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, streak.duration]);

  const animStyle = useAnimatedStyle(() => {
    const t = progress.value;
    // Move along a diagonal vector.
    const dx = Math.cos(streak.angle) * streak.distance * t;
    const dy = -Math.sin(streak.angle) * streak.distance * t;
    // Opacity bumps in the middle of the streak's life.
    const opacity = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
    return {
      transform: [
        { translateX: dx },
        { translateY: dy },
        { rotate: `${streak.angle}rad` },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.streakWrap,
        { left: streak.startX, top: streak.startY, width: streak.width },
        animStyle,
      ]}
    >
      <LinearGradient
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        colors={[
          'rgba(255,255,255,0)',
          'rgba(255,255,255,0.25)',
          'rgba(255,255,255,0.95)',
        ]}
        locations={[0, 0.7, 1]}
        style={styles.streak}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  streakWrap: {
    position: 'absolute',
    height: 1.3,
  },
  streak: {
    flex: 1,
    borderRadius: 1,
  },
});
