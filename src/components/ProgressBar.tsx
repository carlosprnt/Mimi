import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '@/theme';

interface ProgressBarProps {
  value: number;
  style?: ViewStyle;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  style,
  height = 24,
}) => {
  const clamped = Math.max(0, Math.min(1, value));
  const progress = useSharedValue(clamped);

  useEffect(() => {
    progress.value = withSpring(clamped, {
      damping: 20,
      stiffness: 80,
      mass: 1,
    });
  }, [clamped, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const radius = height / 2;

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: radius },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          { borderRadius: radius },
          fillStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.success.base,
  },
});
