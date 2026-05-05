import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Svg, {
  Defs,
  Ellipse,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '@/theme';
import { Button } from './Button';

interface StickyActionProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'subtle' | 'outline' | 'destructive';
  onPressMore?: () => void;
  moreLabel?: string;
  moreIcon?: keyof typeof Ionicons.glyphMap;
}

const HALO_HEIGHT = 80;

const StartHalo: React.FC = () => {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.85, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View pointerEvents="none" style={[styles.halo, animStyle]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <RadialGradient
            id="btn-halo"
            cx="50" cy="50" rx="55" ry="55" fx="50" fy="50"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0"    stopColor="#D8C8FF" stopOpacity="0.55" />
            <Stop offset="0.45" stopColor="#A8A5E6" stopOpacity="0.22" />
            <Stop offset="0.8"  stopColor="#A8A5E6" stopOpacity="0.06" />
            <Stop offset="1"    stopColor="#A8A5E6" stopOpacity="0"    />
          </RadialGradient>
        </Defs>
        <Ellipse cx="50" cy="50" rx="50" ry="50" fill="url(#btn-halo)" />
      </Svg>
    </Animated.View>
  );
};

export const StickyAction: React.FC<StickyActionProps> = ({
  title,
  onPress,
  variant = 'primary',
  onPressMore,
  moreLabel,
  moreIcon = 'ellipsis-horizontal',
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { paddingBottom: Math.max(insets.bottom, spacing.base) },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.primarySlot}>
          {variant === 'outline' && <StartHalo />}
          <Button title={title} onPress={onPress} variant={variant} blur />
        </View>
        {onPressMore ? (
          <Pressable
            onPress={onPressMore}
            accessibilityRole="button"
            accessibilityLabel={moreLabel}
            hitSlop={8}
            style={({ pressed }) => [
              styles.more,
              pressed && styles.morePressed,
            ]}
          >
            <BlurView
              intensity={Platform.OS === 'ios' ? 24 : 14}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name={moreIcon} size={22} color={colors.pure.white} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  primarySlot: {
    flex: 1,
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    left: -40,
    right: -40,
    top: -((HALO_HEIGHT - 48) / 2),
    height: HALO_HEIGHT,
  },
  more: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'hidden',
  },
  morePressed: {
    opacity: 0.6,
  },
});
