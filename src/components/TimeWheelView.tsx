import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { WheelPicker, WHEEL_ITEM_HEIGHT, WHEEL_VISIBLE_COUNT } from './WheelPicker';
import { colors, spacing } from '@/theme';
import { lightImpact } from '@/utils/haptics';

interface TimeWheelViewProps {
  initial: Date;
  use24h?: boolean;
  onClose: () => void;
  onConfirm: (value: Date) => void;
}

const pad2 = (n: number): string => (n < 10 ? `0${n}` : String(n));

/**
 * The wheel picker UI without a Sheet wrapper. Designed to be embedded
 * inside an existing Sheet (avoids RN Modal nesting, which crashes on
 * iOS with new arch + Reanimated 4).
 *
 * iOS uses the native DateTimePicker in spinner mode — three native
 * columns (day · hour · minute), perfectly aligned, no jitter, with
 * proper haptics from the system. Android falls back to the custom
 * wheel implementation since native datetime spinner isn't supported
 * inline on that platform.
 */
export const TimeWheelView: React.FC<TimeWheelViewProps> = (props) => {
  if (Platform.OS === 'ios') {
    return <NativeIOSPicker {...props} />;
  }
  return <CustomWheelPicker {...props} />;
};

const NativeIOSPicker: React.FC<TimeWheelViewProps> = ({
  initial,
  use24h = true,
  onClose,
  onConfirm,
}) => {
  const [value, setValue] = useState<Date>(initial);

  useEffect(() => {
    setValue(initial);
  }, [initial]);

  const handleConfirm = () => {
    lightImpact();
    onConfirm(value);
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

      <View style={styles.nativePickerWrap}>
        <DateTimePicker
          value={value}
          mode="time"
          display="spinner"
          themeVariant="dark"
          textColor={colors.text.primary}
          locale={undefined}
          is24Hour={use24h}
          onChange={(_, d) => {
            if (d) setValue(d);
          }}
          style={styles.nativePicker}
        />
      </View>
    </View>
  );
};

const CustomWheelPicker: React.FC<TimeWheelViewProps> = ({
  initial,
  use24h = true,
  onClose,
  onConfirm,
}) => {
  const [hour, setHour] = useState(initial.getHours());
  const [minute, setMinute] = useState(initial.getMinutes());

  useEffect(() => {
    setHour(initial.getHours());
    setMinute(initial.getMinutes());
  }, [initial]);

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
    const out = new Date(initial);
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
            items={hourItems}
            selectedIndex={hour}
            onChange={setHour}
            width={80}
            align="center"
          />
          <WheelPicker
            items={minuteItems}
            selectedIndex={minute}
            onChange={setMinute}
            width={80}
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
  nativePickerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.lg,
  },
  nativePicker: {
    width: '100%',
    height: 200,
  },
});
