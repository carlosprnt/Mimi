import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
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
  status?: string;
}

const COLLAPSE_DISTANCE = 80;
const BG_FADE_DISTANCE = 40;

const BTN_EXPANDED = 40;
const BTN_COLLAPSED = 32;

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  name,
  scrollY,
  onPressMenu,
  menuLabel,
  status,
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
      paddingTop: insets.top + interpolate(p, [0, 1], [16, 10]),
      paddingBottom: interpolate(p, [0, 1], [16, 10]),
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
    const scale = interpolate(p, [0, 1], [1, 0.6]);
    return {
      transform: [{ scale }],
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

  const backdropHeight = insets.top + 200;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.backdrop,
          { height: backdropHeight },
          bgAnim,
        ]}
      >
        <MaskedView
          style={StyleSheet.absoluteFill}
          maskElement={
            <LinearGradient
              colors={[
                'rgba(0,0,0,1)',
                'rgba(0,0,0,0.85)',
                'rgba(0,0,0,0)',
              ]}
              locations={[0, 0.55, 1]}
              style={StyleSheet.absoluteFill}
            />
          }
        >
          <BlurView
            intensity={36}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(11, 20, 54, 0.6)' },
            ]}
          />
        </MaskedView>
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

        {status ? (
          <Text
            variant="eyebrow"
            tone="accent"
            numberOfLines={1}
            style={styles.status}
          >
            {status}
          </Text>
        ) : null}

        <View style={styles.nameWrap}>
          <Animated.View style={[styles.nameInner, nameAnim]}>
            <Text
              variant="display"
              tone="primary"
              numberOfLines={1}
              style={styles.name}
            >
              {name}
            </Text>
          </Animated.View>
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
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  pressed: {
    opacity: 0.7,
  },
  status: {
    flexShrink: 1,
    marginLeft: spacing.xs,
  },
  nameWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  nameInner: {
    transformOrigin: 'right center',
  },
  name: {
    fontFamily: fonts.medium,
    textAlign: 'right',
    fontSize: 34,
    lineHeight: 38,
  },
});
