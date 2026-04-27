import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WheelPicker, WHEEL_ITEM_HEIGHT, WHEEL_VISIBLE_COUNT } from './WheelPicker';
import { colors, spacing } from '@/theme';
import { startOfDay } from '@/logic/format';
import { t } from '@/i18n';
import { lightImpact } from '@/utils/haptics';

interface TimeWheelViewProps {
  initial: Date;
  use24h?: boolean;
  rangeBefore?: number;
  rangeAfter?: number;
  onClose: () => void;
  onConfirm: (value: Date) => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const buildDates = (around: Date, before: number, after: number): Date[] => {
  const base = startOfDay(around);
  const out: Date[] = [];
  for (let i = -before; i <= after; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    out.push(d);
  }
  return out;
};

const dayDiff = (a: Date, b: Date): number =>
  Math.round(
    (startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY_MS,
  );

const formatDateLabel = (d: Date, today: Date): string => {
  const diff = dayDiff(d, today);
  if (diff === 0) return t('date.today').toLocaleLowerCase();
  if (diff === -1) return t('date.yesterday').toLocaleLowerCase();
  return d
    .toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    .replace('.', '')
    .replace(',', '');
};

const pad2 = (n: number): string => (n < 10 ? `0${n}` : String(n));

/**
 * The wheel picker UI without a Sheet wrapper. Designed to be embedded
 * inside an existing Sheet (avoids RN Modal nesting, which crashes on
 * iOS with new arch + Reanimated 4).
 */
export const TimeWheelView: React.FC<TimeWheelViewProps> = ({
  initial,
  use24h = true,
  rangeBefore = 30,
  rangeAfter = 7,
  onClose,
  onConfirm,
}) => {
  const today = useMemo(() => startOfDay(new Date()), []);
  const dates = useMemo(
    () => buildDates(today, rangeBefore, rangeAfter),
    [today, rangeBefore, rangeAfter],
  );

  const initialDayIndex = useMemo(() => {
    const target = startOfDay(initial).getTime();
    const idx = dates.findIndex((d) => d.getTime() === target);
    return idx >= 0 ? idx : rangeBefore;
  }, [dates, initial, rangeBefore]);

  const [dayIndex, setDayIndex] = useState(initialDayIndex);
  const [hour, setHour] = useState(initial.getHours());
  const [minute, setMinute] = useState(initial.getMinutes());

  useEffect(() => {
    setDayIndex(initialDayIndex);
    setHour(initial.getHours());
    setMinute(initial.getMinutes());
  }, [initial, initialDayIndex]);

  const dateItems = useMemo(
    () =>
      dates.map((d, i) => ({
        key: i,
        label: formatDateLabel(d, today),
      })),
    [dates, today],
  );

  const hourItems = useMemo(() => {
    if (use24h) {
      return Array.from({ length: 24 }, (_, h) => ({
        key: h,
        label: pad2(h),
      }));
    }
    return Array.from({ length: 24 }, (_, h) => ({
      key: h,
      label: String(((h + 11) % 12) + 1),
    }));
  }, [use24h]);

  const minuteItems = useMemo(
    () =>
      Array.from({ length: 60 }, (_, m) => ({
        key: m,
        label: pad2(m),
      })),
    [],
  );

  const handleConfirm = () => {
    const day = dates[dayIndex] ?? dates[rangeBefore];
    const out = new Date(day);
    out.setHours(hour, minute, 0, 0);
    lightImpact();
    onConfirm(out);
  };

  return (
    <View>
      <View style={styles.headerBar}>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            styles.btn,
            styles.btnGhost,
            pressed && styles.btnPressed,
          ]}
          hitSlop={8}
        >
          <Ionicons name="close" size={20} color={colors.text.secondary} />
        </Pressable>
        <Pressable
          onPress={handleConfirm}
          style={({ pressed }) => [
            styles.btn,
            styles.btnPrimary,
            pressed && styles.btnPressed,
          ]}
          hitSlop={8}
        >
          <Ionicons name="checkmark" size={22} color={colors.pure.white} />
        </Pressable>
      </View>

      <View style={styles.wheelArea}>
        <View style={styles.lens} pointerEvents="none" />
        <View style={styles.columns}>
          <WheelPicker
            items={dateItems}
            selectedIndex={dayIndex}
            onChange={setDayIndex}
            width={150}
            align="right"
          />
          <WheelPicker
            items={hourItems}
            selectedIndex={hour}
            onChange={setHour}
            width={64}
            align="center"
          />
          <WheelPicker
            items={minuteItems}
            selectedIndex={minute}
            onChange={setMinute}
            width={64}
            align="center"
          />
        </View>
      </View>
    </View>
  );
};

const WHEEL_HEIGHT = WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_COUNT;

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  btnPrimary: {
    backgroundColor: colors.accent.base,
  },
  btnPressed: {
    opacity: 0.7,
  },
  wheelArea: {
    height: WHEEL_HEIGHT,
    justifyContent: 'center',
    paddingBottom: spacing.lg,
  },
  lens: {
    position: 'absolute',
    top: WHEEL_HEIGHT / 2 - WHEEL_ITEM_HEIGHT / 2,
    height: WHEEL_ITEM_HEIGHT,
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: WHEEL_ITEM_HEIGHT / 2,
    backgroundColor: 'rgba(168, 165, 230, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(168, 165, 230, 0.16)',
  },
  columns: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
