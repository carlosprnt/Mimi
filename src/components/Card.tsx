import React from 'react';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radii, spacing } from '@/theme';

type CardVariant = 'flat' | 'bordered';

interface CardProps extends ViewProps {
  padded?: boolean;
  tone?: 'elevated' | 'sunken' | 'night';
  variant?: CardVariant;
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
  style,
  children,
  ...rest
}) => {
  const bg = toneToBg[tone];

  if (variant === 'bordered') {
    const isNight = tone === 'night';
    return (
      <View {...rest} style={[styles.bordered, style]}>
        {isNight ? (
          <>
            <BlurView
              intensity={Platform.OS === 'ios' ? 40 : 24}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: 'rgba(11, 20, 54, 0.55)' },
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
