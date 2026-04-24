import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { colors, fonts, radii, spacing } from '@/theme';
import { Text } from './Text';

type Variant = 'primary' | 'ghost' | 'subtle';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  loading,
  disabled,
  style,
  ...rest
}) => {
  const isDisabled = disabled || loading;

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
        pressed && !isDisabled && pressedStyle[variant],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.text.onAccent : colors.accent.base}
        />
      ) : (
        <View style={styles.inner}>
          <Text
            variant="headline"
            tone={variant === 'primary' ? 'onAccent' : 'accent'}
            style={styles.label}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
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
};

const pressedStyle: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.accent.pressed, transform: [{ scale: 0.995 }] },
  ghost: { opacity: 0.6 },
  subtle: { backgroundColor: colors.border.hairline },
};
