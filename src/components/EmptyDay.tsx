import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { spacing } from '@/theme';
import { Text } from './Text';
import { MoonIllustration } from './MoonIllustration';
import { t } from '@/i18n';

const SPIN_DURATION_MS = 36000;
const TILT_DURATION_MS = 4000;
const FLOAT_DURATION_MS = 5200;

export const EmptyDay: React.FC = () => {
  const spin = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const floatY = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(360, {
        duration: SPIN_DURATION_MS,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    tiltY.value = withRepeat(
      withSequence(
        withTiming(10, {
          duration: TILT_DURATION_MS,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(-10, {
          duration: TILT_DURATION_MS,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      -1,
      false,
    );
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, {
          duration: FLOAT_DURATION_MS,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(6, {
          duration: FLOAT_DURATION_MS,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      -1,
      false,
    );
  }, [spin, tiltY, floatY]);

  const moonStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { translateY: floatY.value },
      { rotateY: `${tiltY.value}deg` },
      { rotate: `${spin.value}deg` },
    ],
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.illustration}>
        <Animated.View style={moonStyle}>
          <MoonIllustration size={170} />
        </Animated.View>
      </View>
      <Text variant="title" tone="primary" align="center" style={styles.title}>
        {t('emptyDay.title')}
      </Text>
      <Text variant="callout" tone="secondary" align="center">
        {t('emptyDay.body')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  illustration: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
});
