import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, fonts, spacing } from '@/theme';
import { t } from '@/i18n';

interface DateHeroProps {
  value?: Date;
  onPress: () => void;
  placeholder?: string;
  caption?: string;
}

const formatLong = (d: Date): string =>
  d
    .toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .replace(',', '');

export const DateHero: React.FC<DateHeroProps> = ({
  value,
  onPress,
  placeholder,
  caption,
}) => {
  const ph = placeholder ?? t('onboarding.dob.tapToPick');

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.cell,
          !value && styles.cellPlaceholder,
          pressed && styles.cellPressed,
        ]}
        hitSlop={6}
      >
        <Text
          style={[styles.value, !value && styles.valuePlaceholder]}
          numberOfLines={1}
          align="center"
        >
          {value ? formatLong(value) : ph}
        </Text>
      </Pressable>
      {caption ? (
        <Text variant="footnote" tone="tertiary" style={styles.caption}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  cell: {
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  cellPlaceholder: {
    paddingHorizontal: 18,
    backgroundColor: 'rgba(168, 165, 230, 0.08)',
    borderRadius: 18,
  },
  cellPressed: {
    opacity: 0.55,
  },
  value: {
    fontFamily: fonts.medium,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
    color: colors.text.primary,
  },
  valuePlaceholder: {
    fontSize: 18,
    lineHeight: 24,
    color: colors.text.tertiary,
    letterSpacing: 0,
  },
  caption: {
    marginTop: spacing.xs,
  },
});
