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
const OPEN_VELOCITY = 600;
const SCALE_MIN = 0.9;
const ANIM_DURATION = 380;
const EASING_OUT = Easing.out(Easing.cubic);
const SCENE_GAP = 32;
const GRABBER_TOP = 40;
const FALLBACK_REVEAL_RATIO = 0.62;

export const DrawerSceneWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { height } = useWindowDimensions();
  const navigation = useNavigation();
  const route = useRoute();
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';

  const [menuHeight, setMenuHeight] = useState<number>(
    height * FALLBACK_REVEAL_RATIO - SCENE_GAP,
  );
  const reveal = menuHeight + SCENE_GAP;

  const progress = useSharedValue(0);
  const dragY = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(isDrawerOpen ? 1 : 0, {
      duration: ANIM_DURATION,
      easing: EASING_OUT,
    });
  }, [isDrawerOpen, progress]);

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
    const denom = Math.max(1, reveal);
    const ep = Math.max(0, Math.min(1, progress.value + dragY.value / denom));
    const scale = interpolate(ep, [0, 1], [1, SCALE_MIN], Extrapolation.CLAMP);
    const ty = ep * reveal;
    const radius = interpolate(ep, [0, 1], [0, SCENE_RADIUS], Extrapolation.CLAMP);
    return {
      transform: [{ translateY: ty }, { scale }],
      borderTopLeftRadius: radius,
      borderTopRightRadius: radius,
      borderBottomLeftRadius: radius,
      borderBottomRightRadius: radius,
    };
  });

  const menuVisibilityStyle = useAnimatedStyle(() => {
    const denom = Math.max(1, reveal);
    const ep = Math.max(0, Math.min(1, progress.value + dragY.value / denom));
    return {
      opacity: interpolate(ep, [0, 1], [0, 1], Extrapolation.CLAMP),
    };
  });

  const blurStyle = useAnimatedStyle(() => {
    const denom = Math.max(1, reveal);
    const ep = Math.max(0, Math.min(1, progress.value + dragY.value / denom));
    return {
      opacity: interpolate(ep, [0, 1], [0, 0.55], Extrapolation.CLAMP),
    };
  });

  const grabberStyle = useAnimatedStyle(() => {
    const denom = Math.max(1, reveal);
    const ep = Math.max(0, Math.min(1, progress.value + dragY.value / denom));
    return {
      opacity: interpolate(ep, [0.4, 1], [0, 1], Extrapolation.CLAMP),
    };
  });

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

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const pan = Gesture.Pan()
    .activeOffsetY([-12, 12])
    .onChange((e) => {
      const next = dragY.value + e.changeY;
      dragY.value = isDrawerOpen ? Math.min(0, next) : Math.max(0, next);
    })
    .onEnd((e) => {
      if (isDrawerOpen) {
        const fast = e.velocityY < -CLOSE_VELOCITY;
        const movedUp = dragY.value < -reveal * 0.22;
        if (fast || movedUp) runOnJS(closeDrawer)();
      } else {
        const fast = e.velocityY > OPEN_VELOCITY;
        const movedDown = dragY.value > reveal * 0.18;
        if (fast || movedDown) runOnJS(openDrawer)();
      }
      dragY.value = withTiming(0, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
    });

  return (
    <View style={styles.root}>
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[styles.scene, sceneStyle]}
          pointerEvents={isDrawerOpen ? 'box-only' : 'auto'}
        >
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

      {/* Menu rendered ABOVE the scene. pointerEvents toggles between
          'none' (closed → taps pass through to scene) and 'box-none'
          (open → tile Pressables receive taps; empty space passes
          through to scene). This guarantees menu items are tappable. */}
      <Animated.View
        pointerEvents={isDrawerOpen ? 'box-none' : 'none'}
        style={[styles.menuOverlay, menuVisibilityStyle]}
      >
        <MenuPanel
          activeRoute={route.name as 'Home' | 'History' | 'Profile'}
          onContentHeight={setMenuHeight}
        />
      </Animated.View>
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
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
