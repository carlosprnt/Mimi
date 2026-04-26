import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, fonts } from '@/theme';

export const WHEEL_ITEM_HEIGHT = 40;
export const WHEEL_VISIBLE_COUNT = 5;
const PAD = ((WHEEL_VISIBLE_COUNT - 1) / 2) * WHEEL_ITEM_HEIGHT;
const WHEEL_HEIGHT = WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_COUNT;

export interface WheelItem {
  key: string | number;
  label: string;
}

interface WheelPickerProps {
  items: WheelItem[];
  selectedIndex: number;
  onChange: (index: number) => void;
  width?: number;
  align?: 'center' | 'left' | 'right';
}

const Row: React.FC<{
  index: number;
  label: string;
  scrollY: SharedValue<number>;
  align: 'center' | 'left' | 'right';
}> = ({ index, label, scrollY, align }) => {
  const animStyle = useAnimatedStyle(() => {
    const distance = Math.abs(index * WHEEL_ITEM_HEIGHT - scrollY.value);
    return {
      opacity: interpolate(
        distance,
        [
          0,
          WHEEL_ITEM_HEIGHT,
          WHEEL_ITEM_HEIGHT * 2,
          WHEEL_ITEM_HEIGHT * 3,
        ],
        [1, 0.55, 0.22, 0.08],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          scale: interpolate(
            distance,
            [0, WHEEL_ITEM_HEIGHT * 2],
            [1, 0.86],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  const justify =
    align === 'left'
      ? 'flex-start'
      : align === 'right'
        ? 'flex-end'
        : 'center';

  return (
    <Animated.View style={[styles.row, { justifyContent: justify }, animStyle]}>
      <RNText style={styles.rowText} numberOfLines={1}>
        {label}
      </RNText>
    </Animated.View>
  );
};

export const WheelPicker: React.FC<WheelPickerProps> = ({
  items,
  selectedIndex,
  onChange,
  width = 96,
  align = 'center',
}) => {
  const scrollY = useSharedValue(selectedIndex * WHEEL_ITEM_HEIGHT);
  const ref = useRef<Animated.FlatList<WheelItem>>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const target = selectedIndex * WHEEL_ITEM_HEIGHT;
    ref.current?.scrollToOffset({ offset: target, animated: false });
    scrollY.value = target;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, items.length]);

  const triggerSnap = useCallback((i: number) => {
    Haptics.selectionAsync().catch(() => {});
    onChangeRef.current(i);
  }, []);

  const handler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const lastCount = items.length;
  const snapIndex = useDerivedValue(() => {
    const raw = Math.round(scrollY.value / WHEEL_ITEM_HEIGHT);
    return Math.max(0, Math.min(lastCount - 1, raw));
  }, [lastCount]);

  useAnimatedReaction(
    () => snapIndex.value,
    (curr, prev) => {
      if (prev !== null && curr !== prev) {
        runOnJS(triggerSnap)(curr);
      }
    },
  );

  return (
    <View style={[styles.column, { width, height: WHEEL_HEIGHT }]}>
      <Animated.FlatList
        ref={ref}
        data={items}
        keyExtractor={(item) => String(item.key)}
        renderItem={({ item, index }) => (
          <Row index={index} label={item.label} scrollY={scrollY} align={align} />
        )}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        onScroll={handler}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: PAD, paddingBottom: PAD }}
        getItemLayout={(_, i) => ({
          length: WHEEL_ITEM_HEIGHT,
          offset: WHEEL_ITEM_HEIGHT * i,
          index: i,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    overflow: 'hidden',
  },
  row: {
    height: WHEEL_ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  rowText: {
    fontFamily: fonts.medium,
    fontSize: 22,
    lineHeight: 26,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
});
