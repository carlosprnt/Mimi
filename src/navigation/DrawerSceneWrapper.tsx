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
// Layout when the drawer is fully open. Both the menu panel and the
// scaled dashboard hug these edges of the device.
export const DRAWER_TOP = 100;
export const DRAWER_BOTTOM_MARGIN = 4;
export const DRAWER_LEFT_MARGIN = 4;
export const DRAWER_GAP = 4;
const RADIUS = 32;

export const DrawerSceneWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const progress = useDrawerProgress();
  const { width, height } = useWindowDimensions();

  // Match the dashboard's visible Y range to [DRAWER_TOP, height -
  // DRAWER_BOTTOM_MARGIN] by picking a uniform scale derived from the
  // device height. This also gives a constant translateY of
  // (DRAWER_TOP - (DRAWER_TOP + DRAWER_BOTTOM_MARGIN) / 2) = 48 px.
  const visibleHeight = height - DRAWER_TOP - DRAWER_BOTTOM_MARGIN;
  const scaleTo = visibleHeight / height;
  const translateYTarget = (DRAWER_TOP - DRAWER_BOTTOM_MARGIN) / 2;

  // Land the dashboard's left edge DRAWER_GAP pixels past the menu panel
  // (the panel itself sits inside its drawer container at x = 0; its
  // right edge is at DRAWER_WIDTH).
  const translateXTarget =
    DRAWER_WIDTH + DRAWER_GAP - (width * (1 - scaleTo)) / 2;

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
          translateY: interpolate(
            p,
            [0, 1],
            [0, translateYTarget],
            Extrapolation.CLAMP,
          ),
        },
        {
          scale: interpolate(
            p,
            [0, 1],
            [1, scaleTo],
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
