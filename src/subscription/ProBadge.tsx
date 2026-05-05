import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components';
import { colors, radii, spacing } from '@/theme';
import { t } from '@/i18n';

interface ProBadgeProps {
  tone?: 'soft' | 'solid';
}

export const ProBadge: React.FC<ProBadgeProps> = ({ tone = 'soft' }) => {
  const isSolid = tone === 'solid';
  const shimmerX = useSharedValue(-22);

  useEffect(() => {
    shimmerX.value = withRepeat(
      withSequence(
        withTiming(-22, { duration: 1 }),
        withDelay(3000, withTiming(60, { duration: 380, easing: Easing.out(Easing.quad) })),
      ),
      -1,
      false,
    );
  }, [shimmerX]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  return (
    <View style={[styles.badge, isSolid ? styles.solid : styles.soft]}>
      <Animated.View pointerEvents="none" style={[styles.beam, shimmerStyle]}>
        <LinearGradient
          colors={['transparent', isSolid ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.18)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
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
  beam: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 22,
  },
  label: {
    letterSpacing: 1,
  },
});
