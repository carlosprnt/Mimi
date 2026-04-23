import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, Platform } from 'react-native';
import { colors, typography, TypographyVariant } from '@/theme';

type Tone = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'onAccent' | 'warn';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  tone?: Tone;
  tabular?: boolean;
  align?: 'left' | 'center' | 'right';
}

const toneColor: Record<Tone, string> = {
  primary: colors.text.primary,
  secondary: colors.text.secondary,
  tertiary: colors.text.tertiary,
  accent: colors.accent.base,
  onAccent: colors.text.onAccent,
  warn: colors.warn.soft,
};

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  tone = 'primary',
  tabular,
  align,
  style,
  children,
  ...rest
}) => {
  return (
    <RNText
      {...rest}
      allowFontScaling
      style={[
        typography[variant],
        { color: toneColor[tone] },
        align ? { textAlign: align } : null,
        tabular ? styles.tabular : null,
        style,
      ]}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  tabular: {
    ...Platform.select({
      ios: { fontVariant: ['tabular-nums'] },
      android: { fontFeatureSettings: "'tnum'" },
      default: {},
    }),
  },
});
