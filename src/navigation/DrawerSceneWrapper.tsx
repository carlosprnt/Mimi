import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useDrawerProgress } from '@react-navigation/drawer';
import { BlurView } from 'expo-blur';
import { colors } from '@/theme';

const TRANSLATE_X = 64;
const SCALE_TO = 0.9;
const RADIUS = 32;

export const DrawerSceneWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const progress = useDrawerProgress();

  const sceneStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [
        { translateX: interpolate(p, [0, 1], [0, TRANSLATE_X], Extrapolation.CLAMP) },
        { scale: interpolate(p, [0, 1], [1, SCALE_TO], Extrapolation.CLAMP) },
      ],
      borderRadius: interpolate(p, [0, 1], [0, RADIUS], Extrapolation.CLAMP),
    };
  });

  const blurStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View style={[styles.scene, sceneStyle]}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, blurStyle]}
      >
        <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFillObject} />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.bg.base,
  },
});
