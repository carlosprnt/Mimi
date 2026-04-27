import React, { useEffect, useMemo, useRef } from 'react';
import {
  Platform,
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
import { BlurView } from 'expo-blur';
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
const STICKY_TODAY_RIGHT = spacing.lg;
const STICKY_TODAY_GUTTER = 8;

const dayNumberFormatter = new Intl.DateTimeFormat(undefined, {
  day: '2-digit',
});
const weekdayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
});

const formatDayNumber = (d: Date) => dayNumberFormatter.format(d);
const formatWeekday = (d: Date) =>
  weekdayFormatter.format(d).replace('.', '').toUpperCase();

export const dayKey = (d: Date): string => startOfDay(d).toISOString();

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

  const today = useMemo(() => startOfDay(now), [now]);

  // Days behind today (today itself is rendered as a sticky overlay).
  const days = useMemo(() => {
    const result: Date[] = [];
    for (let i = daysBack; i >= 1; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      result.push(d);
    }
    return result;
  }, [daysBack, today]);

  const isTodaySelected = isSameDay(selectedDate, today);

  const selectedIndex = useMemo(
    () =>
      isTodaySelected
        ? -1
        : days.findIndex((d) => isSameDay(d, selectedDate)),
    [days, selectedDate, isTodaySelected],
  );

  useEffect(() => {
    if (selectedIndex < 0) {
      // Selected date is today (sticky cell) — scroll to far right so the
      // most recent past dates sit next to the pinned today pill.
      const id = setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 50);
      return () => clearTimeout(id);
    }
    const cellSpan = DAY_CELL_WIDTH + DAY_CELL_GAP;
    const offset = Math.max(
      0,
      selectedIndex * cellSpan - width / 2 + DAY_CELL_WIDTH / 2 + spacing.lg,
    );
    const id = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: offset, animated: true });
    }, 50);
    return () => clearTimeout(id);
  }, [selectedIndex, width]);

  // Track whether momentum kicked in. iOS/Android fire onScrollEndDrag
  // when the finger lifts; momentum (the inertial fling) starts and ends
  // separately. We only want to bring the scale back to 1 when motion
  // truly stops — either when momentum ends, or, if there was no fling,
  // when onScrollEndDrag fires and no momentum follows.
  const inMomentumRef = useRef(false);
  const dragEndedAtRef = useRef(0);

  const animateDown = () => {
    cellScale.value = withTiming(0.9, {
      duration: 160,
      easing: Easing.out(Easing.quad),
    });
  };
  const animateUp = () => {
    cellScale.value = withTiming(1, {
      duration: 160,
      easing: Easing.out(Easing.cubic),
    });
  };

  const handleScrollBeginDrag = () => {
    inMomentumRef.current = false;
    animateDown();
  };
  const handleMomentumScrollBegin = () => {
    inMomentumRef.current = true;
  };
  const handleScrollEndDrag = () => {
    dragEndedAtRef.current = Date.now();
    // Give RN a frame to fire onMomentumScrollBegin if a fling is
    // happening; if it doesn't, scale back up here.
    setTimeout(() => {
      if (!inMomentumRef.current) animateUp();
    }, 80);
  };
  const handleMomentumScrollEnd = () => {
    inMomentumRef.current = false;
    animateUp();
  };

  const cellAnim = useAnimatedStyle(() => ({
    transform: [{ scale: cellScale.value }],
  }));

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingRight:
              spacing.lg + DAY_CELL_WIDTH + STICKY_TODAY_GUTTER,
          },
        ]}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollBegin={handleMomentumScrollBegin}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        {days.map((d) => {
          const isSelected = isSameDay(d, selectedDate);
          const hasData = daysWithData ? daysWithData.has(dayKey(d)) : true;
          const textOpacity = isSelected ? 1 : hasData ? 0.7 : 0.3;

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

      <View pointerEvents="box-none" style={styles.stickyWrap}>
        <Pressable
          onPress={() => onSelect(today)}
          style={({ pressed }) => [
            styles.cell,
            styles.stickyCell,
            isTodaySelected && styles.stickyCellSelected,
            pressed && !isTodaySelected && styles.cellPressed,
          ]}
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 30 : 18}
            tint="dark"
            style={[StyleSheet.absoluteFill, styles.stickyBlur]}
          />
          <View pointerEvents="none" style={styles.stickyTint} />
          <Text variant="title" tone="primary" style={styles.dayNumber}>
            {formatDayNumber(today)}
          </Text>
          <Text
            variant="eyebrow"
            tone={isTodaySelected ? 'accent' : 'primary'}
            style={styles.weekday}
          >
            {formatWeekday(today)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
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
  stickyWrap: {
    position: 'absolute',
    right: STICKY_TODAY_RIGHT,
    top: spacing.sm,
    bottom: spacing.sm,
    justifyContent: 'center',
  },
  stickyCell: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  stickyCellSelected: {
    borderColor: 'rgba(168, 165, 230, 0.45)',
  },
  stickyBlur: {
    borderRadius: 14,
  },
  stickyTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 20, 54, 0.4)',
  },
});
