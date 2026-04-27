import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useDrawerProgress } from '@react-navigation/drawer';
import { BlurView } from 'expo-blur';
import { colors } from '@/theme';

export const DRAWER_WIDTH = 320;
export const DRAWER_SCALE_TO = 0.8;
export const DRAWER_GAP = 4;
const RADIUS = 32;

export const DrawerSceneWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const progress = useDrawerProgress();
  const { width } = useWindowDimensions();

  // Dashboard, scaled to DRAWER_SCALE_TO with center origin, has its left
  // edge at width * (1 - DRAWER_SCALE_TO) / 2. Translate so that left edge
  // sits DRAWER_GAP pixels to the right of the menu panel's right edge.
  const translateXTarget =
    DRAWER_WIDTH + DRAWER_GAP - (width * (1 - DRAWER_SCALE_TO)) / 2;

  const sceneStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [
        {
          translateX: interpolate(
            p,
            [0, 1],
            [0, translateXTarget],
            Extrapolation.CLAMP,
          ),
        },
        {
          scale: interpolate(
            p,
            [0, 1],
            [1, DRAWER_SCALE_TO],
            Extrapolation.CLAMP,
          ),
        },
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
        <BlurView
          intensity={28}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
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
