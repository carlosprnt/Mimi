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
import { Text } from '@/components';
import { colors, radii, spacing } from '@/theme';
import { t } from '@/i18n';

interface ProBadgeProps {
  tone?: 'soft' | 'solid';
}

export const ProBadge: React.FC<ProBadgeProps> = ({ tone = 'soft' }) => {
  const isSolid = tone === 'solid';
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 3200 }),
        withTiming(1, { duration: 480, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 720, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [shimmer]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value * 0.35,
  }));

  return (
    <View style={[styles.badge, isSolid ? styles.solid : styles.soft]}>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, styles.shimmer, shimmerStyle]}
      />
      <Text
        variant="eyebrow"
        tone={isSolid ? 'onAccent' : 'accent'}
        style={styles.label}
      >
        {t('pro.badge')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  soft: {
    backgroundColor: colors.accent.soft,
  },
  solid: {
    backgroundColor: colors.accent.base,
  },
  shimmer: {
    backgroundColor: '#FFFFFF',
  },
  label: {
    letterSpacing: 1,
  },
});
