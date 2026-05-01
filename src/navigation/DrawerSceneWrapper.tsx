import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  Extrapolation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { useRoute } from '@react-navigation/native';
import { useMenuStore } from '@/state/menuStore';
import { MenuPanel } from './MenuPanel';

const EDGE_TRIGGER_X = 30;
const EDGE_OPEN_DISTANCE = 60;

const ANIM_OPEN = 480;
const ANIM_CLOSE = 280;
const EASING_OUT = Easing.out(Easing.cubic);
const TINT_COLOR = 'rgba(11, 20, 54, 0.55)';

export const DrawerSceneWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const isOpen = useMenuStore((s) => s.open);
  const setOpen = useMenuStore((s) => s.setOpen);

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(isOpen ? 1 : 0, {
      duration: isOpen ? ANIM_OPEN : ANIM_CLOSE,
      easing: EASING_OUT,
    });
  }, [isOpen, progress]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  // Edge-swipe to open the menu — only on the dashboard (Home). On
  // the inner stack screens (History / Profile / etc.) the system
  // back gesture stays enabled so swiping right from the edge takes
  // you back to the dashboard naturally.
  const route = useRoute();
  const isHome = route.name === 'Home';
  const edgeStartX = useSharedValue(-1);
  const openMenu = () => setOpen(true);
  const edgeOpenGesture = Gesture.Pan()
    .enabled(!isOpen && isHome)
    .activeOffsetX(20)
    .failOffsetY([-25, 25])
    .onBegin((e) => {
      edgeStartX.value = e.absoluteX;
    })
    .onEnd((e) => {
      if (edgeStartX.value < 0 || edgeStartX.value > EDGE_TRIGGER_X) return;
      if (e.translationX > EDGE_OPEN_DISTANCE) {
        runOnJS(openMenu)();
      }
    });

  return (
    <View style={styles.root}>
      <GestureDetector gesture={edgeOpenGesture}>
        <View style={styles.scene}>{children}</View>
      </GestureDetector>

      {/* Backdrop: tap-anywhere closes the menu. pointerEvents flips so
          the dashboard remains tappable while the menu is closed. */}
      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[StyleSheet.absoluteFillObject, overlayStyle]}
      >
        <BlurView
          intensity={32}
          tint="dark"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[StyleSheet.absoluteFillObject, styles.tint]} pointerEvents="none" />

        <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setOpen(false)} />

        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <MenuPanel progress={progress} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scene: {
    flex: 1,
  },
  tint: {
    backgroundColor: TINT_COLOR,
  },
});
