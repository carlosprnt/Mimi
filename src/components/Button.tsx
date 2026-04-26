import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  PressableProps,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, fonts, radii, spacing } from '@/theme';
import { Text } from './Text';

type Variant = 'primary' | 'ghost' | 'subtle' | 'outline' | 'destructive';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
  style?: ViewStyle;
  blur?: boolean;
}

const blurCapableVariants: Variant[] = ['outline', 'subtle', 'destructive'];

const labelTone = (variant: Variant): 'primary' | 'onAccent' | 'accent' | 'danger' => {
  if (variant === 'primary') return 'onAccent';
  if (variant === 'destructive') return 'danger';
  return 'accent';
};

const spinnerColor = (variant: Variant): string => {
  if (variant === 'primary') return colors.text.onAccent;
  if (variant === 'destructive') return colors.danger.base;
  return colors.accent.base;
};

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  loading,
  disabled,
  style,
  blur,
  ...rest
}) => {
  const isDisabled = disabled || loading;
  const useBlur = blur && blurCapableVariants.includes(variant);

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      android_ripple={
        variant === 'primary'
          ? { color: colors.accent.pressed, borderless: false }
          : { color: colors.border.strong, borderless: false }
      }
      style={({ pressed }) => [
        styles.base,
        variantStyle[variant],
        useBlur && styles.blurOverflow,
        pressed && !isDisabled && pressedStyle[variant],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {useBlur ? (
        <BlurView
          intensity={Platform.OS === 'ios' ? 24 : 14}
          tint="dark"
          style={[StyleSheet.absoluteFill, styles.blurLayer]}
        />
      ) : null}
      {loading ? (
        <ActivityIndicator color={spinnerColor(variant)} />
      ) : (
        <View style={styles.inner}>
          <Text variant="headline" tone={labelTone(variant)} style={styles.label}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  blurOverflow: {
    overflow: 'hidden',
  },
  blurLayer: {
    borderRadius: radii.pill,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontFamily: fonts.medium,
  },
  disabled: {
    opacity: 0.4,
  },
});

const variantStyle: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.accent.base },
  ghost: { backgroundColor: 'transparent' },
  subtle: { backgroundColor: colors.bg.elevated },
  outline: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  destructive: {
    backgroundColor: colors.danger.soft,
    borderWidth: 1,
    borderColor: colors.danger.border,
  },
};

const pressedStyle: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.accent.pressed, transform: [{ scale: 0.995 }] },
  ghost: { opacity: 0.6 },
  subtle: { backgroundColor: colors.border.hairline },
  outline: { backgroundColor: 'rgba(255, 255, 255, 0.14)' },
  destructive: { backgroundColor: 'rgba(226, 107, 98, 0.22)' },
};
