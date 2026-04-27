import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';

interface SignOutIconProps {
  size?: number;
}

/**
 * Log-out icon with a slow right→left drift on the arrow inside it.
 * The container stays put; only the arrow glyph (the bigger part of
 * the icon) shifts a couple of pixels every ~3 s, then resets. Subtle.
 */
export const SignOutIcon: React.FC<SignOutIconProps> = ({ size = 20 }) => {
  const x = useSharedValue(0);

  useEffect(() => {
    x.value = withRepeat(
      withSequence(
        withTiming(-3, {
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(0, {
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      -1,
      false,
    );
  }, [x]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={style}>
        <Ionicons
          name="log-out-outline"
          size={size}
          color={colors.danger.base}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
