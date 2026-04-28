import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import {
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
const SCALE_MIN = 0.95;
const ANIM_DURATION = 380;
const EASING_OUT = Easing.out(Easing.cubic);

export const DrawerSceneWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { height } = useWindowDimensions();
  const navigation = useNavigation();
  const route = useRoute();
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';

  const reveal = height * DRAWER_REVEAL_RATIO;
  const progress = useSharedValue(0);
  const dragY = useSharedValue(0);

  // Drive our own progress so we can use a quick-then-slow easing curve
  // independent of the React Navigation drawer animation.
  useEffect(() => {
    progress.value = withTiming(isDrawerOpen ? 1 : 0, {
      duration: ANIM_DURATION,
      easing: EASING_OUT,
    });
  }, [isDrawerOpen, progress]);

  const sceneStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      progress.value,
      [0, 1],
      [1, SCALE_MIN],
      Extrapolation.CLAMP,
    );
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
      transform: [{ translateY: totalY }, { scale }],
      borderTopLeftRadius: radius,
      borderTopRightRadius: radius,
      borderBottomLeftRadius: radius,
      borderBottomRightRadius: radius,
    };
  });

  const blurStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const grabberStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.4, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const closeDrawer = () => {
    navigation.dispatch(DrawerActions.closeDrawer());
  };

  const pan = Gesture.Pan()
    .enabled(isDrawerOpen)
    .activeOffsetY([-12, 12])
    .onChange((e) => {
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
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, blurStyle]}
          >
            <BlurView
              intensity={18}
              tint="dark"
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[styles.grabberWrap, grabberStyle]}
          >
            <View style={styles.grabber} />
          </Animated.View>
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
  grabberWrap: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  grabber: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
});
