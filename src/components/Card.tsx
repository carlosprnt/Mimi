import React from 'react';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radii, spacing } from '@/theme';

type CardVariant = 'flat' | 'bordered';
type CardEmphasis = 'default' | 'frosted';

interface CardProps extends ViewProps {
  padded?: boolean;
  tone?: 'elevated' | 'sunken' | 'night';
  variant?: CardVariant;
  emphasis?: CardEmphasis;
}

const toneToBg = {
  elevated: colors.bg.elevated,
  sunken: colors.bg.sunken,
  night: colors.night.card,
} as const;

export const Card: React.FC<CardProps> = ({
  padded = true,
  tone = 'elevated',
  variant = 'flat',
  emphasis = 'default',
  style,
  children,
  ...rest
}) => {
  const bg = toneToBg[tone];

  if (variant === 'bordered') {
    const isNight = tone === 'night';
    const isFrosted = isNight && emphasis === 'frosted';
    const blurIntensity = isFrosted
      ? Platform.OS === 'ios'
        ? 70
        : 36
      : Platform.OS === 'ios'
        ? 40
        : 24;
    const overlayColor = isFrosted
      ? 'rgba(11, 20, 54, 0.28)'
      : 'rgba(11, 20, 54, 0.55)';
    return (
      <View {...rest} style={[styles.bordered, style]}>
        {isNight ? (
          <>
            <BlurView
              intensity={blurIntensity}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: overlayColor },
              ]}
            />
          </>
        ) : (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: bg }]}
          />
        )}
        <View style={padded ? styles.padded : undefined}>{children}</View>
      </View>
    );
  }

  return (
    <View
      {...rest}
      style={[
        styles.card,
        { backgroundColor: bg },
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  padded: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  bordered: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.night.cardEdge,
  },
});
