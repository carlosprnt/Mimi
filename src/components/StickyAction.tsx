import React, { useEffect, useState } from 'react';
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
  SharedValue,
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

// ---------------------------------------------------------------------------
// Start-sleep halo: simple pulsing radial glow
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// End-sleep halo: orbiting comet(s)
// ---------------------------------------------------------------------------

/** A single glow spot following an elliptical orbit. */
const OrbitSpot: React.FC<{
  angle: SharedValue<number>;
  /** Degree offset from the lead angle — creates the tail. */
  offset: number;
  hw: number;
  hh: number;
  size: number;
  opacity: number;
  color?: string;
}> = ({ angle, offset, hw, hh, size, opacity, color = '#C4B5FF' }) => {
  const style = useAnimatedStyle(() => {
    const rad = ((angle.value + offset) * Math.PI) / 180;
    return {
      opacity,
      transform: [
        { translateX: hw * Math.cos(rad) },
        { translateY: hh * Math.sin(rad) },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: '#9088F0',
          shadowOpacity: 1,
          shadowRadius: size,
          shadowOffset: { width: 0, height: 0 },
        },
        style,
      ]}
    />
  );
};

const EndHalo: React.FC<{ slotWidth: number }> = ({ slotWidth }) => {
  // Orbit semi-axes: extends ~14px beyond the button on each side.
  const hw = slotWidth / 2 + 14;
  const hh = 30;

  // Two comets at different speeds for the organic multi-arc feel.
  const angle1 = useSharedValue(0);
  const angle2 = useSharedValue(195); // offset start so arcs look independent

  useEffect(() => {
    angle1.value = withRepeat(
      withTiming(360, { duration: 2900, easing: Easing.linear }),
      -1,
      false,
    );
    angle2.value = withRepeat(
      withTiming(195 + 360, { duration: 3700, easing: Easing.linear }),
      -1,
      false,
    );
  }, [angle1, angle2]);

  return (
    <View pointerEvents="none" style={styles.orbitContainer}>
      {/* Faint static ring */}
      <Svg
        width={slotWidth + 28}
        height={hh * 2 + 16}
        style={styles.orbitRingSvg}
      >
        <Ellipse
          cx={(slotWidth + 28) / 2}
          cy={(hh * 2 + 16) / 2}
          rx={hw}
          ry={hh}
          stroke="rgba(168,165,230,0.14)"
          strokeWidth="1"
          fill="none"
        />
      </Svg>

      {/* Comet 1 — primary (faster) */}
      <OrbitSpot angle={angle1} offset={0}   hw={hw} hh={hh} size={16} opacity={0.92} />
      <OrbitSpot angle={angle1} offset={-16} hw={hw} hh={hh} size={11} opacity={0.38} />
      <OrbitSpot angle={angle1} offset={-32} hw={hw} hh={hh} size={7}  opacity={0.14} />

      {/* Comet 2 — secondary (slower, dimmer) */}
      <OrbitSpot angle={angle2} offset={0}   hw={hw} hh={hh} size={12} opacity={0.55} color="#B0A8F5" />
      <OrbitSpot angle={angle2} offset={-20} hw={hw} hh={hh} size={8}  opacity={0.22} color="#B0A8F5" />
    </View>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const StickyAction: React.FC<StickyActionProps> = ({
  title,
  onPress,
  variant = 'primary',
  onPressMore,
  moreLabel,
  moreIcon = 'ellipsis-horizontal',
}) => {
  const insets = useSafeAreaInsets();
  const [slotWidth, setSlotWidth] = useState(240);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { paddingBottom: Math.max(insets.bottom, spacing.base) },
      ]}
    >
      <View style={styles.row}>
        <View
          style={styles.primarySlot}
          onLayout={(e) => setSlotWidth(e.nativeEvent.layout.width)}
        >
          {variant === 'outline' && <StartHalo />}
          {variant === 'destructive' && slotWidth > 0 && (
            <EndHalo slotWidth={slotWidth} />
          )}
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
  orbitContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitRingSvg: {
    position: 'absolute',
    left: -14,
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
