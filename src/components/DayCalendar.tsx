import React, { useEffect, useMemo, useRef } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
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
const SCROLL_GAP_BUMP = 4;
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

const Cell: React.FC<{
  index: number;
  total: number;
  date: Date;
  isSelected: boolean;
  hasData: boolean;
  onPress: () => void;
  scrollX: SharedValue<number>;
  active: SharedValue<number>;
  fadeBoundaryRight: number;
  scrollViewWidth: number;
}> = ({
  index,
  total,
  date,
  isSelected,
  hasData,
  onPress,
  scrollX,
  active,
  fadeBoundaryRight,
  scrollViewWidth,
}) => {
  const baseSpan = DAY_CELL_WIDTH + DAY_CELL_GAP;

  const animStyle = useAnimatedStyle(() => {
    const a = active.value;
    const extraGap = a * SCROLL_GAP_BUMP;
    // The cell's right-edge X in screen coords (before transform). The
    // ScrollView's contentOffset.x slides the strip left as the user
    // scrolls right; cells with x close to the fade boundary get
    // attenuated.
    const cellSpan = baseSpan + extraGap;
    const cellLeftInContent = spacing.lg + index * cellSpan;
    const cellRightInContent = cellLeftInContent + DAY_CELL_WIDTH;
    const cellRightOnScreen = cellRightInContent - scrollX.value;
    // Once a cell's right edge crosses fadeBoundaryRight, it begins to
    // disappear; by the time it's behind the sticky cell entirely,
    // opacity 0.
    const opacity = interpolate(
      cellRightOnScreen,
      [fadeBoundaryRight, fadeBoundaryRight + DAY_CELL_WIDTH],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return {
      opacity,
      marginRight: index === total - 1 ? 0 : extraGap,
      transform: [
        {
          scale: interpolate(a, [0, 1], [1, 0.9], Extrapolation.CLAMP),
        },
      ],
    };
  });

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.cell,
          isSelected && styles.cellSelected,
          pressed && !isSelected && styles.cellPressed,
        ]}
      >
        <Text
          variant="title"
          tone="primary"
          style={[
            styles.dayNumber,
            { opacity: isSelected ? 1 : hasData ? 0.7 : 0.3 },
          ]}
        >
          {formatDayNumber(date)}
        </Text>
        <Text
          variant="eyebrow"
          tone={isSelected ? 'accent' : 'primary'}
          style={[
            styles.weekday,
            { opacity: isSelected ? 1 : hasData ? 0.7 : 0.3 },
          ]}
        >
          {formatWeekday(date)}
        </Text>
        {hasData && !isSelected ? <View style={styles.dot} /> : null}
      </Pressable>
    </Animated.View>
  );
};

export const DayCalendar: React.FC<DayCalendarProps> = ({
  selectedDate,
  onSelect,
  daysBack = 30,
  now = new Date(),
  daysWithData,
}) => {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);
  const active = useSharedValue(0);

  const today = useMemo(() => startOfDay(now), [now]);

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

  const inMomentumRef = useRef(false);

  const animateDown = () => {
    active.value = withTiming(1, {
      duration: 160,
      easing: Easing.out(Easing.quad),
    });
  };
  const animateUp = () => {
    active.value = withTiming(0, {
      duration: 160,
      easing: Easing.out(Easing.cubic),
    });
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const handleScrollBeginDrag = () => {
    inMomentumRef.current = false;
    animateDown();
  };
  const handleMomentumScrollBegin = () => {
    inMomentumRef.current = true;
  };
  const handleScrollEndDrag = () => {
    setTimeout(() => {
      if (!inMomentumRef.current) animateUp();
    }, 80);
  };
  const handleMomentumScrollEnd = () => {
    inMomentumRef.current = false;
    animateUp();
  };

  // The sticky today cell sits at right: STICKY_TODAY_RIGHT and is
  // DAY_CELL_WIDTH wide. So its left edge in screen coords is at
  // (width - STICKY_TODAY_RIGHT - DAY_CELL_WIDTH).
  const fadeBoundaryRight = width - STICKY_TODAY_RIGHT - DAY_CELL_WIDTH;

  return (
    <View style={styles.wrap}>
      <Animated.ScrollView
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
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollBegin={handleMomentumScrollBegin}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        {days.map((d, i) => (
          <Cell
            key={d.toISOString()}
            index={i}
            total={days.length}
            date={d}
            isSelected={isSameDay(d, selectedDate)}
            hasData={daysWithData ? daysWithData.has(dayKey(d)) : true}
            onPress={() => onSelect(d)}
            scrollX={scrollX}
            active={active}
            fadeBoundaryRight={fadeBoundaryRight}
            scrollViewWidth={width}
          />
        ))}
      </Animated.ScrollView>

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
