import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  accent?: 'violet' | 'success';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  style,
  height = 24,
  accent = 'violet',
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
        style={[styles.fillWrap, { borderRadius: radius }, fillStyle]}
      >
        <LinearGradient
          colors={
            accent === 'success'
              ? ['#C8FFD2', colors.success.base, '#48B26C']
              : ['#D7D2FF', colors.accent.base, colors.accent.pressed]
          }
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        />
        <View
          style={[
            styles.shine,
            { borderRadius: radius },
          ]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  fillWrap: {
    height: '100%',
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
});
