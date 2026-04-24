import React from 'react';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors, gradients, radii, spacing } from '@/theme';

type CardVariant = 'flat' | 'bordered';

interface CardProps extends ViewProps {
  padded?: boolean;
  tone?: 'elevated' | 'sunken' | 'night';
  variant?: CardVariant;
}

const BORDER_WIDTH = 1;

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
      <View {...rest} style={[styles.borderedWrap, style]}>
        <LinearGradient
          colors={gradients.cardBorder.colors}
          locations={gradients.cardBorder.locations}
          start={gradients.cardBorder.start}
          end={gradients.cardBorder.end}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.borderedInner]}>
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
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: bg },
              ]}
            />
          )}
          <View style={padded ? styles.padded : undefined}>{children}</View>
        </View>
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
  borderedWrap: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    padding: BORDER_WIDTH,
  },
  borderedInner: {
    borderRadius: radii.xl - BORDER_WIDTH,
    overflow: 'hidden',
  },
});
