import React, { useEffect } from 'react';
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
import { colors, fonts } from '@/theme';

const RISE_PX = 22;
const PERIOD_MS = 2400;
const STAGGER_MS = 800;

interface BubbleProps {
  delay: number;
  size: number;
}

const Bubble: React.FC<BubbleProps> = ({ delay, size }) => {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: PERIOD_MS,
            easing: Easing.inOut(Easing.quad),
          }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
  }, [t, delay]);

  const style = useAnimatedStyle(() => {
    const v = t.value;
    // opacity 0 → 1 → 0 across the cycle
    const opacity =
      v < 0.5 ? v * 2 : (1 - v) * 2;
    // scale 0.6 → 1.0 → 0.85 — bubble feel
    const scale =
      v < 0.5 ? 0.6 + v * 0.8 : 1.0 - (v - 0.5) * 0.3;
    return {
      opacity,
      transform: [{ translateY: -v * RISE_PX }, { scale }],
    };
  });

  return (
    <Animated.Text
      allowFontScaling={false}
      style={[styles.zText, { fontSize: size }, style]}
    >
      z
    </Animated.Text>
  );
};

export const SleepingZzz: React.FC = () => {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Bubble delay={0} size={11} />
      <Bubble delay={STAGGER_MS} size={13} />
      <Bubble delay={STAGGER_MS * 2} size={15} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 32,
    width: 36,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  zText: {
    fontFamily: fonts.medium,
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
});
