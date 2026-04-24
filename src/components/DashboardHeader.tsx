import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  interpolate,
  Extrapolation,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '@/theme';
import { Text } from './Text';

interface DashboardHeaderProps {
  name: string;
  scrollY: SharedValue<number>;
  onPressMenu: () => void;
  menuLabel: string;
}

const COLLAPSE_DISTANCE = 80;
const BG_FADE_DISTANCE = 40;

const BTN_EXPANDED = 40;
const BTN_COLLAPSED = 32;
const NAME_EXPANDED = 34;
const NAME_COLLAPSED = 20;
const PADDING_V_EXPANDED = 16;
const PADDING_V_COLLAPSED = 10;

const AnimatedText = Animated.createAnimatedComponent(Text);

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  name,
  scrollY,
  onPressMenu,
  menuLabel,
}) => {
  const insets = useSafeAreaInsets();

  const containerAnim = useAnimatedStyle(() => {
    const p = interpolate(
      scrollY.value,
      [0, COLLAPSE_DISTANCE],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      paddingTop: insets.top + interpolate(p, [0, 1], [
        PADDING_V_EXPANDED,
        PADDING_V_COLLAPSED,
      ]),
      paddingBottom: interpolate(p, [0, 1], [
        PADDING_V_EXPANDED,
        PADDING_V_COLLAPSED,
      ]),
    };
  });

  const btnAnim = useAnimatedStyle(() => {
    const p = interpolate(
      scrollY.value,
      [0, COLLAPSE_DISTANCE],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const size = interpolate(p, [0, 1], [BTN_EXPANDED, BTN_COLLAPSED]);
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
    };
  });

  const iconAnim = useAnimatedStyle(() => {
    const p = interpolate(
      scrollY.value,
      [0, COLLAPSE_DISTANCE],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ scale: interpolate(p, [0, 1], [1, 0.85]) }],
    };
  });

  const nameAnim = useAnimatedStyle(() => {
    const p = interpolate(
      scrollY.value,
      [0, COLLAPSE_DISTANCE],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      fontSize: interpolate(p, [0, 1], [NAME_EXPANDED, NAME_COLLAPSED]),
      lineHeight: interpolate(
        p,
        [0, 1],
        [NAME_EXPANDED + 4, NAME_COLLAPSED + 4],
      ),
    };
  });

  const bgAnim = useAnimatedStyle(() => {
    const p = interpolate(
      scrollY.value,
      [0, BG_FADE_DISTANCE],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity: p };
  });

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, bgAnim]}>
        <BlurView
          intensity={32}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(11, 20, 54, 0.55)' },
          ]}
        />
        <View style={styles.hairline} />
      </Animated.View>

      <Animated.View style={[styles.row, containerAnim]}>
        <Pressable
          onPress={onPressMenu}
          accessibilityRole="button"
          accessibilityLabel={menuLabel}
          hitSlop={8}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Animated.View style={[styles.btn, btnAnim]}>
            <Animated.View style={iconAnim}>
              <Ionicons name="menu" size={22} color={colors.pure.white} />
            </Animated.View>
          </Animated.View>
        </Pressable>

        <View style={styles.nameWrap}>
          <AnimatedText
            variant="display"
            tone="primary"
            numberOfLines={1}
            style={[styles.name, nameAnim]}
          >
            {name}
          </AnimatedText>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  hairline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  pressed: {
    opacity: 0.7,
  },
  nameWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  name: {
    fontFamily: fonts.medium,
    textAlign: 'right',
  },
});
