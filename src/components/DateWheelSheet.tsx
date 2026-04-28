import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Sheet } from './Sheet';
import { WheelPicker, WHEEL_ITEM_HEIGHT, WHEEL_VISIBLE_COUNT } from './WheelPicker';
import { colors, spacing } from '@/theme';
import { lightImpact } from '@/utils/haptics';

interface DateWheelSheetProps {
  visible: boolean;
  initial: Date;
  minDate?: Date;
  maxDate?: Date;
  onClose: () => void;
  onConfirm: (value: Date) => void;
}

const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

const monthLabel = (m: number): string => {
  const ref = new Date(2000, m, 1);
  return ref
    .toLocaleDateString(undefined, { month: 'short' })
    .replace('.', '');
};

const daysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const clampDay = (day: number, year: number, month: number) =>
  Math.min(day, daysInMonth(year, month));

export const DateWheelSheet: React.FC<DateWheelSheetProps> = ({
  visible,
  initial,
  minDate,
  maxDate,
  onClose,
  onConfirm,
}) => {
  const today = new Date();
  const minYear = minDate?.getFullYear() ?? today.getFullYear() - 6;
  const maxYear = maxDate?.getFullYear() ?? today.getFullYear() + 1;

  const years = useMemo(
    () =>
      Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i),
    [minYear, maxYear],
  );

  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth());
  const [day, setDay] = useState(initial.getDate());

  useEffect(() => {
    if (visible) {
      setYear(initial.getFullYear());
      setMonth(initial.getMonth());
      setDay(initial.getDate());
    }
  }, [visible, initial]);

  // Keep day valid when month/year change.
  useEffect(() => {
    setDay((d) => clampDay(d, year, month));
  }, [year, month]);

  const dayItems = useMemo(() => {
    const max = daysInMonth(year, month);
    return Array.from({ length: max }, (_, i) => ({
      key: i + 1,
      label: pad2(i + 1),
    }));
  }, [year, month]);

  const monthItems = useMemo(
    () =>
      Array.from({ length: 12 }, (_, m) => ({
        key: m,
        label: monthLabel(m),
      })),
    [],
  );

  const yearItems = useMemo(
    () => years.map((y) => ({ key: y, label: String(y) })),
    [years],
  );

  const yearIndex = years.indexOf(year);

  const handleConfirm = () => {
    const out = new Date(year, month, clampDay(day, year, month));
    if (minDate && out.getTime() < minDate.getTime()) {
      lightImpact();
      onConfirm(new Date(minDate));
      return;
    }
    if (maxDate && out.getTime() > maxDate.getTime()) {
      lightImpact();
      onConfirm(new Date(maxDate));
      return;
    }
    lightImpact();
    onConfirm(out);
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
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
          <Ionicons name="checkmark" size={22} color={colors.text.onAccent} />
        </Pressable>
      </View>

      <View style={styles.wheelArea}>
        <View style={styles.lens} pointerEvents="none" />
        <View style={styles.columns}>
          <WheelPicker
            items={dayItems}
            selectedIndex={day - 1}
            onChange={(i) => setDay(i + 1)}
            width={64}
            align="center"
          />
          <WheelPicker
            items={monthItems}
            selectedIndex={month}
            onChange={setMonth}
            width={96}
            align="center"
          />
          <WheelPicker
            items={yearItems}
            selectedIndex={yearIndex >= 0 ? yearIndex : years.length - 1}
            onChange={(i) => setYear(years[i])}
            width={96}
            align="center"
          />
        </View>
      </View>
    </Sheet>
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
