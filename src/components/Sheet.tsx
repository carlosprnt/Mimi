import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, spacing, motion } from '@/theme';

type SheetVariant = 'surface' | 'frosted' | 'night';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  variant?: SheetVariant;
  snap?: 'spring' | 'timing';
}

const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 850;

export const Sheet: React.FC<SheetProps> = ({
  visible,
  onClose,
  children,
  variant = 'surface',
  snap = 'timing',
}) => {
  const { height } = useWindowDimensions();
  const translate = useSharedValue(height);
  const backdrop = useSharedValue(0);
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translate.value =
        snap === 'spring'
          ? withSpring(0, motion.spring.sheet)
          : withTiming(0, { duration: motion.duration.base });
      backdrop.value = withTiming(1, { duration: motion.duration.base });
    } else if (mounted) {
      backdrop.value = withTiming(0, { duration: motion.duration.fast });
      translate.value = withTiming(
        height,
        { duration: motion.duration.base },
        (finished) => {
          if (finished) runOnJS(setMounted)(false);
        },
      );
    }
  }, [visible, mounted, height, translate, backdrop, snap]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translate.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  // Pan gesture on the entire sheet body: drag down to dismiss. The
  // 15px activation threshold means small vertical movements pass
  // through to children (e.g. the time-picker wheel keeps spinning
  // freely; only a deliberate downward swipe of >15px takes over and
  // starts dismissing). Past 110px or a fast flick it closes; else
  // springs back.
  const dragGesture = Gesture.Pan()
    .activeOffsetY(15)
    .failOffsetX([-25, 25])
    .onUpdate((e) => {
      translate.value = Math.max(0, e.translationY);
      backdrop.value = Math.max(0, 1 - e.translationY / 280);
    })
    .onEnd((e) => {
      const shouldClose =
        e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY;
      if (shouldClose) {
        runOnJS(onClose)();
      } else {
        translate.value = withTiming(0, { duration: motion.duration.fast });
        backdrop.value = withTiming(1, { duration: motion.duration.fast });
      }
    });

  const isFrosted = variant === 'frosted';
  const isNight = variant === 'night';

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[
            styles.backdrop,
            isFrosted && styles.backdropFrosted,
            backdropStyle,
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            isFrosted
              ? styles.sheetFrosted
              : isNight
                ? styles.sheetNight
                : styles.sheetSurface,
            sheetStyle,
          ]}
        >
          {isFrosted ? (
            <>
              <BlurView
                intensity={Platform.OS === 'ios' ? 90 : 50}
                tint="systemUltraThinMaterialDark"
                experimentalBlurMethod="dimezisBlurView"
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: 'rgba(7, 11, 31, 0.18)' },
                ]}
              />
            </>
          ) : null}
          {isNight ? (
            <>
              {/* Soft blur for the modern glassy feel — translucent
                  enough that the gradient on top reads as a tinted
                  layer, not a hard fill. */}
              <BlurView
                intensity={Platform.OS === 'ios' ? 60 : 36}
                tint="dark"
                experimentalBlurMethod="dimezisBlurView"
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              {/* Dark-blue → blue-black gradient. Top stays #14235A
                  with ~88% alpha so a hint of the blur reads through;
                  bottom fades to a deeper #020410 at 96% alpha. */}
              <LinearGradient
                colors={[
                  'rgba(20, 35, 90, 0.88)',
                  'rgba(2, 4, 16, 0.96)',
                ]}
                locations={[0, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
            </>
          ) : null}
          <GestureDetector gesture={dragGesture}>
            <SafeAreaView edges={['bottom']}>
              <View style={styles.grabberWrap}>
                <View style={styles.grabber} />
              </View>
              <View style={styles.content}>{children}</View>
            </SafeAreaView>
          </GestureDetector>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg.overlay,
  },
  backdropFrosted: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 30,
        shadowOffset: { width: 0, height: 12 },
      },
      android: { elevation: 12 },
    }),
  },
  sheetSurface: {
    backgroundColor: colors.night.bottom,
  },
  sheetFrosted: {
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sheetNight: {
    // Background painted by the BlurView + LinearGradient stack
    // injected for the night variant. Stroke is a soft hairline so it
    // reads as a frame without competing with the gradient.
    backgroundColor: 'transparent',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  grabberWrap: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
});
