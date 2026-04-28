import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  useDrawerProgress,
  useDrawerStatus,
} from '@react-navigation/drawer';
import {
  useNavigation,
  useRoute,
  DrawerActions,
} from '@react-navigation/native';
import { colors } from '@/theme';
import { MenuPanel } from './MenuPanel';

export const DRAWER_REVEAL_RATIO = 0.62;
const SCENE_RADIUS = 28;
const CLOSE_VELOCITY = 600;

export const DrawerSceneWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const progress = useDrawerProgress();
  const { height } = useWindowDimensions();
  const navigation = useNavigation();
  const route = useRoute();
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';

  const reveal = height * DRAWER_REVEAL_RATIO;
  const dragY = useSharedValue(0);

  const sceneStyle = useAnimatedStyle(() => {
    const baseY = interpolate(
      progress.value,
      [0, 1],
      [0, reveal],
      Extrapolation.CLAMP,
    );
    const totalY = Math.max(0, baseY + dragY.value);
    const radius = interpolate(
      progress.value,
      [0, 1],
      [0, SCENE_RADIUS],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ translateY: totalY }],
      borderTopLeftRadius: radius,
      borderTopRightRadius: radius,
    };
  });

  const closeDrawer = () => {
    navigation.dispatch(DrawerActions.closeDrawer());
  };

  const pan = Gesture.Pan()
    .enabled(isDrawerOpen)
    .activeOffsetY([-12, 12])
    .onChange((e) => {
      // Only let the user drag the sheet upward (closing direction).
      const next = dragY.value + e.changeY;
      dragY.value = Math.min(0, next);
    })
    .onEnd((e) => {
      const fast = e.velocityY < -CLOSE_VELOCITY;
      const movedUp = dragY.value < -reveal * 0.22;
      if (fast || movedUp) {
        runOnJS(closeDrawer)();
      }
      dragY.value = withSpring(0, { damping: 18, stiffness: 220 });
    });

  return (
    <View style={styles.root}>
      <MenuPanel
        activeRoute={route.name as 'Home' | 'History' | 'Profile'}
        navigation={navigation}
      />
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.scene, sceneStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.night.bottom,
  },
  scene: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.bg.base,
  },
});
