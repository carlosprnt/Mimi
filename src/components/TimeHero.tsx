import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, fonts, spacing } from '@/theme';
import { formatClock } from '@/logic/format';

interface TimeHeroProps {
  primary?: Date;
  secondary?: Date;
  isRange?: boolean;
  use24h?: boolean;
  onPressPrimary?: () => void;
  onPressSecondary?: () => void;
}

const PLACEHOLDER = '–– : ––';

export const TimeHero: React.FC<TimeHeroProps> = ({
  primary,
  secondary,
  isRange = false,
  use24h = true,
  onPressPrimary,
  onPressSecondary,
}) => {
  const renderCell = (
    value: Date | undefined,
    onPress: (() => void) | undefined,
  ) => {
    const tappable = !!onPress;
    return (
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [
          styles.cell,
          tappable && styles.cellTappable,
          pressed && styles.cellPressed,
        ]}
        hitSlop={6}
      >
        <Text
          style={[styles.time, !value && styles.timePlaceholder]}
          numberOfLines={1}
        >
          {value ? formatClock(value, use24h) : PLACEHOLDER}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {renderCell(primary, onPressPrimary)}
        {isRange ? (
          <>
            <Text style={styles.dash}>—</Text>
            {renderCell(secondary, onPressSecondary)}
          </>
        ) : null}
      </View>
    </View>
  );
};

const CELL_HEIGHT = 56;

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
    minWidth: 132,
    height: CELL_HEIGHT,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellTappable: {
    backgroundColor: 'rgba(168, 165, 230, 0.10)',
    borderRadius: CELL_HEIGHT / 2,
  },
  cellPressed: {
    opacity: 0.55,
  },
  time: {
    fontFamily: fonts.medium,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.4,
    color: colors.text.primary,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  timePlaceholder: {
    color: colors.text.tertiary,
    letterSpacing: 1,
  },
  dash: {
    fontFamily: fonts.regular,
    fontSize: 28,
    lineHeight: CELL_HEIGHT,
    color: colors.text.tertiary,
    paddingHorizontal: 2,
    textAlignVertical: 'center',
  },
});
