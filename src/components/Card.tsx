import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radii, spacing } from '@/theme';

interface CardProps extends ViewProps {
  padded?: boolean;
  tone?: 'elevated' | 'sunken';
}

export const Card: React.FC<CardProps> = ({
  padded = true,
  tone = 'elevated',
  style,
  children,
  ...rest
}) => {
  return (
    <View
      {...rest}
      style={[
        styles.card,
        { backgroundColor: colors.bg[tone] },
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
});
