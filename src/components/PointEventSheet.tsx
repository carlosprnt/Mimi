import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Sheet } from './Sheet';
import { Text } from './Text';
import { Button } from './Button';
import { colors, spacing } from '@/theme';
import { t } from '@/i18n';

interface PointEventSheetProps {
  visible: boolean;
  title: string;
  initial: Date;
  initialEnd?: Date;
  withEnd?: boolean;
  onClose: () => void;
  onSave: (time: Date, endTime?: Date) => void;
  onDelete?: () => void;
}

export const PointEventSheet: React.FC<PointEventSheetProps> = ({
  visible,
  title,
  initial,
  initialEnd,
  withEnd = false,
  onClose,
  onSave,
  onDelete,
}) => {
  const [value, setValue] = useState<Date>(initial);
  const [endValue, setEndValue] = useState<Date | undefined>(initialEnd);

  useEffect(() => {
    if (visible) {
      setValue(initial);
      setEndValue(initialEnd);
    }
  }, [visible, initial, initialEnd]);

  const handleSave = () => {
    if (withEnd) {
      // If user picked an end time earlier than start, assume it crossed
      // midnight and add 24h.
      let end = endValue;
      if (end && end.getTime() <= value.getTime()) {
        end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
      }
      onSave(value, end);
    } else {
      onSave(value);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text variant="title" style={styles.title}>
        {title}
      </Text>

      <View style={styles.pickerBlock}>
        <Text variant="eyebrow" tone="tertiary" style={styles.label}>
          {withEnd ? t('timeline.startTime') : t('timeline.time')}
        </Text>
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={value}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            textColor={colors.text.primary}
            themeVariant="dark"
            onChange={(_, d) => d && setValue(d)}
          />
        </View>
      </View>

      {withEnd ? (
        <View style={styles.pickerBlock}>
          <Text variant="eyebrow" tone="tertiary" style={styles.label}>
            {t('timeline.endTime')}
          </Text>
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={endValue ?? value}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              textColor={colors.text.primary}
              themeVariant="dark"
              onChange={(_, d) => d && setEndValue(d)}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button title={t('profile.save')} onPress={handleSave} />
        <View style={{ height: spacing.sm }} />
        <Button title={t('profile.cancel')} variant="ghost" onPress={onClose} />
        {onDelete ? (
          <>
            <View style={{ height: spacing.sm }} />
            <Button
              title={t('timeline.deleteEvent')}
              variant="dangerGhost"
              onPress={onDelete}
            />
          </>
        ) : null}
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  pickerBlock: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
  },
  pickerWrap: {
    alignItems: 'center',
  },
  actions: {
    marginTop: spacing.lg,
  },
});
