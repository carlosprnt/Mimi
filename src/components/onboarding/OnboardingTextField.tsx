import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { colors, fonts } from '@/theme';

interface OnboardingTextFieldProps
  extends Omit<TextInputProps, 'style' | 'onFocus' | 'onBlur'> {
  align?: 'center' | 'left';
}

export const OnboardingTextField: React.FC<OnboardingTextFieldProps> = ({
  align = 'center',
  ...rest
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <TextInput
        {...rest}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={colors.text.tertiary}
        style={[
          styles.input,
          { textAlign: align },
        ]}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="done"
      />
      <View
        style={[styles.underline, focused && styles.underlineFocused]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 8,
  },
  input: {
    fontFamily: fonts.medium,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text.primary,
    paddingVertical: 6,
    minHeight: 44,
  },
  underline: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginTop: 4,
  },
  underlineFocused: {
    height: 1.5,
    backgroundColor: colors.accent.base,
  },
});
