import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';

const STAGE_HEIGHT = 220;
const MOON_BASE_SIZE = 96;
const HALO_SIZE = 220;

interface IllustrationStageProps {
  step: number;
  total: number;
  sex?: 'girl' | 'boy';
}

const haloViolet = '#A8A5E6';
const haloBlue = '#7CC2F0';

export const IllustrationStage: React.FC<IllustrationStageProps> = ({
  step,
  total,
  sex,
}) => {
  const progress = useSharedValue(step);
  const tint = useSharedValue(sex === 'boy' ? 1 : 0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(step, {
      duration: 600,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [step, progress]);

  useEffect(() => {
    tint.value = withTiming(sex === 'boy' ? 1 : 0, {
      duration: 400,
      easing: Easing.out(Easing.quad),
    });
  }, [sex, tint]);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0, {
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const moonStyle = useAnimatedStyle(() => {
    const p = progress.value / Math.max(1, total - 1);
    return {
      transform: [
        {
          translateY: interpolate(
            p,
            [0, 0.2, 0.5, 1],
            [12, -4, -10, -16],
            Extrapolation.CLAMP,
          ),
        },
        {
          scale: interpolate(
            p,
            [0, 1],
            [1, 1.08],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  const haloStyle = useAnimatedStyle(() => {
    const p = progress.value / Math.max(1, total - 1);
    const baseOpacity = interpolate(
      p,
      [0, 1],
      [0.55, 0.9],
      Extrapolation.CLAMP,
    );
    const pulseAdd = interpolate(pulse.value, [0, 1], [0, 0.12]);
    return {
      opacity: baseOpacity + pulseAdd,
      transform: [
        {
          scale: interpolate(
            pulse.value,
            [0, 1],
            [0.96, 1.04],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  const haloColor = useDerivedValue(() =>
    tint.value > 0.5 ? haloBlue : haloViolet,
  );

  const haloFillStyle = useAnimatedStyle(() => ({
    backgroundColor: haloColor.value,
  }));

  return (
    <View style={styles.stage} pointerEvents="none">
      <Animated.View style={[styles.halo, haloStyle]}>
        <Svg width={HALO_SIZE} height={HALO_SIZE}>
          <Defs>
            <RadialGradient
              id="onboarding-halo"
              cx={HALO_SIZE / 2}
              cy={HALO_SIZE / 2}
              rx={HALO_SIZE / 2}
              ry={HALO_SIZE / 2}
              fx={HALO_SIZE / 2}
              fy={HALO_SIZE / 2}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor={haloViolet} stopOpacity="0.45" />
              <Stop offset="0.45" stopColor={haloViolet} stopOpacity="0.18" />
              <Stop offset="1" stopColor={haloViolet} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle
            cx={HALO_SIZE / 2}
            cy={HALO_SIZE / 2}
            r={HALO_SIZE / 2}
            fill="url(#onboarding-halo)"
          />
        </Svg>
        <Animated.View style={[styles.haloTint, haloFillStyle]} />
      </Animated.View>

      <Animated.View style={[styles.moon, moonStyle]}>
        <Svg width={MOON_BASE_SIZE} height={MOON_BASE_SIZE}>
          <Defs>
            <RadialGradient
              id="moon-body"
              cx={MOON_BASE_SIZE * 0.4}
              cy={MOON_BASE_SIZE * 0.36}
              rx={MOON_BASE_SIZE * 0.55}
              ry={MOON_BASE_SIZE * 0.55}
              fx={MOON_BASE_SIZE * 0.4}
              fy={MOON_BASE_SIZE * 0.36}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
              <Stop offset="0.6" stopColor="#E6E4F2" stopOpacity="0.9" />
              <Stop offset="1" stopColor="#A8A5E6" stopOpacity="0.85" />
            </RadialGradient>
          </Defs>
          <Circle
            cx={MOON_BASE_SIZE / 2}
            cy={MOON_BASE_SIZE / 2}
            r={MOON_BASE_SIZE / 2}
            fill="url(#moon-body)"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  stage: {
    height: STAGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: HALO_SIZE,
    height: HALO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloTint: {
    position: 'absolute',
    width: HALO_SIZE * 0.35,
    height: HALO_SIZE * 0.35,
    borderRadius: HALO_SIZE * 0.175,
    opacity: 0.16,
  },
  moon: {
    width: MOON_BASE_SIZE,
    height: MOON_BASE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
