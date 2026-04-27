import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../Text';
import { colors, fonts, spacing } from '@/theme';

type Provider = 'apple' | 'google';

interface AuthButtonProps {
  provider: Provider;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  provider,
  label,
  onPress,
  disabled,
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        provider === 'apple' ? styles.apple : styles.google,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.iconWrap}>
        {provider === 'apple' ? (
          <Ionicons name="logo-apple" size={20} color={colors.pure.white} />
        ) : (
          <View style={styles.googleGlyph}>
            <Text style={styles.googleG}>G</Text>
          </View>
        )}
      </View>
      <Text
        style={[
          styles.label,
          provider === 'google' && styles.labelGoogle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  apple: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  google: {
    backgroundColor: '#FFFFFF',
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.5,
  },
  iconWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleGlyph: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 16,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.pure.white,
  },
  labelGoogle: {
    color: '#1F1F1F',
  },
});
