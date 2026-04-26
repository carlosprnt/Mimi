import React, { useEffect, useMemo, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts, spacing } from '@/theme';
import { Text } from './Text';
import { isSameDay, startOfDay } from '@/logic/format';

interface DayCalendarProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  daysBack?: number;
  now?: Date;
  daysWithData?: ReadonlySet<string>;
}

const DAY_CELL_WIDTH = 44;
const DAY_CELL_GAP = 6;

const dayNumberFormatter = new Intl.DateTimeFormat(undefined, {
  day: '2-digit',
});
const weekdayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
});

const formatDayNumber = (d: Date) => dayNumberFormatter.format(d);
const formatWeekday = (d: Date) =>
  weekdayFormatter.format(d).replace('.', '').toUpperCase();

export const dayKey = (d: Date): string =>
  startOfDay(d).toISOString();

export const DayCalendar: React.FC<DayCalendarProps> = ({
  selectedDate,
  onSelect,
  daysBack = 30,
  now = new Date(),
  daysWithData,
}) => {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const cellScale = useSharedValue(1);

  const days = useMemo(() => {
    const result: Date[] = [];
    const today = startOfDay(now);
    for (let i = daysBack; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      result.push(d);
    }
    return result;
  }, [daysBack, now]);

  const selectedIndex = useMemo(
    () => days.findIndex((d) => isSameDay(d, selectedDate)),
    [days, selectedDate],
  );

  useEffect(() => {
    if (selectedIndex < 0) return;
    const idx = selectedIndex;
    const cellSpan = DAY_CELL_WIDTH + DAY_CELL_GAP;
    const offset = Math.max(
      0,
      idx * cellSpan - width / 2 + DAY_CELL_WIDTH / 2 + spacing.lg,
    );
    const id = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: offset, animated: true });
    }, 50);
    return () => clearTimeout(id);
  }, [selectedIndex, width]);

  const handleScrollStart = () => {
    cellScale.value = withTiming(0.95, {
      duration: 180,
      easing: Easing.out(Easing.quad),
    });
  };
  const handleScrollEnd = () => {
    cellScale.value = withTiming(1, {
      duration: 240,
      easing: Easing.out(Easing.quad),
    });
  };

  const cellAnim = useAnimatedStyle(() => ({
    transform: [{ scale: cellScale.value }],
  }));

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      onScrollBeginDrag={handleScrollStart}
      onMomentumScrollBegin={handleScrollStart}
      onScrollEndDrag={handleScrollEnd}
      onMomentumScrollEnd={handleScrollEnd}
    >
      {days.map((d) => {
        const isSelected = isSameDay(d, selectedDate);
        const hasData = daysWithData ? daysWithData.has(dayKey(d)) : true;

        let textOpacity = 1;
        if (!isSelected) {
          textOpacity = hasData ? 0.7 : 0.3;
        }

        return (
          <Animated.View key={d.toISOString()} style={cellAnim}>
            <Pressable
              onPress={() => onSelect(d)}
              style={({ pressed }) => [
                styles.cell,
                isSelected && styles.cellSelected,
                pressed && !isSelected && styles.cellPressed,
              ]}
            >
              <Text
                variant="title"
                tone="primary"
                style={[styles.dayNumber, { opacity: textOpacity }]}
              >
                {formatDayNumber(d)}
              </Text>
              <Text
                variant="eyebrow"
                tone={isSelected ? 'accent' : 'primary'}
                style={[styles.weekday, { opacity: textOpacity }]}
              >
                {formatWeekday(d)}
              </Text>
              {hasData && !isSelected ? (
                <View style={styles.dot} />
              ) : null}
            </Pressable>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    gap: DAY_CELL_GAP,
    paddingVertical: spacing.sm,
  },
  cell: {
    width: DAY_CELL_WIDTH,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  cellSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  cellPressed: {
    opacity: 0.6,
  },
  dayNumber: {
    fontFamily: fonts.medium,
    fontSize: 18,
    lineHeight: 22,
  },
  weekday: {
    marginTop: 4,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.accent.base,
    position: 'absolute',
    bottom: 3,
  },
});
