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
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, spacing, motion } from '@/theme';

type SheetVariant = 'surface' | 'frosted';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  variant?: SheetVariant;
  snap?: 'spring' | 'timing';
}

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

  const isFrosted = variant === 'frosted';

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
            isFrosted ? styles.sheetFrosted : styles.sheetSurface,
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
          <SafeAreaView edges={['bottom']}>
            <View style={styles.grabberWrap}>
              <View style={styles.grabber} />
            </View>
            <View style={styles.content}>{children}</View>
          </SafeAreaView>
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
  grabberWrap: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
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
