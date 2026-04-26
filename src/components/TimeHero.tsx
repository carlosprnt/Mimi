import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, fonts, spacing } from '@/theme';
import { formatClock, isSameDay, startOfDay } from '@/logic/format';
import { t } from '@/i18n';

interface TimeHeroProps {
  primary?: Date;
  secondary?: Date;
  isRange?: boolean;
  use24h?: boolean;
  onPressPrimary?: () => void;
  onPressSecondary?: () => void;
  placeholder?: string;
}

const formatDateScope = (d: Date): string => {
  const today = new Date();
  if (isSameDay(d, today)) return t('date.today');
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(d, yesterday)) return t('date.yesterday');
  return d
    .toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    .replace('.', '')
    .replace(',', '');
};

const sameDay = (a?: Date, b?: Date): boolean => {
  if (!a || !b) return true;
  return startOfDay(a).getTime() === startOfDay(b).getTime();
};

export const TimeHero: React.FC<TimeHeroProps> = ({
  primary,
  secondary,
  isRange = false,
  use24h = true,
  onPressPrimary,
  onPressSecondary,
  placeholder,
}) => {
  const ph = placeholder ?? t('timeline.setTime');

  const dateScope = primary
    ? formatDateScope(primary)
    : secondary
      ? formatDateScope(secondary)
      : null;

  const showSecondScope =
    isRange && primary && secondary && !sameDay(primary, secondary)
      ? formatDateScope(secondary)
      : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          onPress={onPressPrimary}
          disabled={!onPressPrimary}
          style={({ pressed }) => [
            styles.cell,
            !primary && styles.cellPlaceholder,
            pressed && styles.cellPressed,
          ]}
          hitSlop={6}
        >
          <Text
            style={[styles.time, !primary && styles.timePlaceholder]}
            numberOfLines={1}
          >
            {primary ? formatClock(primary, use24h) : ph}
          </Text>
        </Pressable>

        {isRange ? (
          <>
            <Text style={styles.dash}>—</Text>
            <Pressable
              onPress={onPressSecondary}
              disabled={!onPressSecondary}
              style={({ pressed }) => [
                styles.cell,
                !secondary && styles.cellPlaceholder,
                pressed && styles.cellPressed,
              ]}
              hitSlop={6}
            >
              <Text
                style={[styles.time, !secondary && styles.timePlaceholder]}
                numberOfLines={1}
              >
                {secondary ? formatClock(secondary, use24h) : ph}
              </Text>
            </Pressable>
          </>
        ) : null}
      </View>

      {dateScope ? (
        <Text variant="footnote" tone="tertiary" style={styles.scope}>
          {showSecondScope ? `${dateScope} → ${showSecondScope}` : dateScope}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cell: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  cellPlaceholder: {
    paddingHorizontal: 14,
    backgroundColor: 'rgba(168, 165, 230, 0.08)',
    borderRadius: 16,
  },
  cellPressed: {
    opacity: 0.55,
  },
  time: {
    fontFamily: fonts.medium,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -0.5,
    color: colors.text.primary,
  },
  timePlaceholder: {
    fontSize: 20,
    lineHeight: 26,
    color: colors.text.tertiary,
    letterSpacing: 0,
  },
  dash: {
    fontFamily: fonts.regular,
    fontSize: 28,
    lineHeight: 32,
    color: colors.text.tertiary,
    paddingHorizontal: 4,
  },
  scope: {
    marginTop: 4,
  },
});
