import React, { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawerStatus } from '@react-navigation/drawer';
import {
  useNavigation,
  useRoute,
  DrawerActions,
} from '@react-navigation/native';
import { colors } from '@/theme';
import { MenuPanel } from './MenuPanel';

const SCENE_RADIUS = 28;
const CLOSE_VELOCITY = 600;
const SCALE_MIN = 0.95;
const ANIM_DURATION = 380;
const EASING_OUT = Easing.out(Easing.cubic);
const SCENE_GAP = 40; // distance from last menu item to top of scene
const GRABBER_TOP = 40; // distance from scene's top to the drag pill
const FALLBACK_REVEAL_RATIO = 0.62;

export const DrawerSceneWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { height } = useWindowDimensions();
  const navigation = useNavigation();
  const route = useRoute();
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';

  // Menu measures itself; we use that height + a 40px gap as the reveal.
  const [menuHeight, setMenuHeight] = useState<number>(
    height * FALLBACK_REVEAL_RATIO - SCENE_GAP,
  );
  const reveal = menuHeight + SCENE_GAP;

  const progress = useSharedValue(0);
  const dragY = useSharedValue(0);
  const shimmer = useSharedValue(-1);

  useEffect(() => {
    progress.value = withTiming(isDrawerOpen ? 1 : 0, {
      duration: ANIM_DURATION,
      easing: EASING_OUT,
    });
  }, [isDrawerOpen, progress]);

  // Continuously animate a shimmer that sweeps across the grabber pill.
  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1800 }),
      ),
      -1,
      false,
    );
  }, [shimmer]);

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
      // Use layout `top` so hit-testing matches the visual position —
      // taps on the menu area no longer hit the translated scene.
      top: totalY,
      height,
      transform: [{ scale }],
      borderTopLeftRadius: radius,
      borderTopRightRadius: radius,
      borderBottomLeftRadius: radius,
      borderBottomRightRadius: radius,
    };
  });

  const blurStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.55], Extrapolation.CLAMP),
  }));

  const grabberStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.4, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shimmer.value,
          [0, 1],
          [-32, 64],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const closeDrawer = () => {
    navigation.dispatch(DrawerActions.closeDrawer());
  };

  const pan = Gesture.Pan()
    .enabled(isDrawerOpen)
    .activeOffsetY(-12)
    .failOffsetY(12)
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
        onContentHeight={setMenuHeight}
      />
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.scene, sceneStyle]}>
          {children}
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, blurStyle]}
          >
            <BlurView
              intensity={8}
              tint="dark"
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[styles.grabberWrap, grabberStyle]}
          >
            <View style={styles.grabber}>
              <Animated.View style={[styles.shimmerWrap, shimmerStyle]}>
                <LinearGradient
                  colors={[
                    'rgba(255,255,255,0)',
                    'rgba(255,255,255,0.95)',
                    'rgba(255,255,255,0)',
                  ]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.shimmer}
                />
              </Animated.View>
            </View>
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
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
    backgroundColor: colors.bg.base,
  },
  grabberWrap: {
    position: 'absolute',
    top: GRABBER_TOP,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  grabber: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  shimmerWrap: {
    width: 32,
    height: 4,
  },
  shimmer: {
    width: 32,
    height: 4,
  },
});
