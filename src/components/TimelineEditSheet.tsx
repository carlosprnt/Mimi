import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Sheet } from './Sheet';
import { Text } from './Text';
import { Button } from './Button';
import { colors, spacing } from '@/theme';
import { t } from '@/i18n';

export type TimelineEditKind = 'wake' | 'nap';

interface TimelineEditSheetProps {
  visible: boolean;
  kind: TimelineEditKind;
  initialStart?: Date;
  initialEnd?: Date;
  onClose: () => void;
  onSave: (update: { startedAt?: string; endedAt?: string }) => void;
}

export const TimelineEditSheet: React.FC<TimelineEditSheetProps> = ({
  visible,
  kind,
  initialStart,
  initialEnd,
  onClose,
  onSave,
}) => {
  const [start, setStart] = useState<Date | undefined>(initialStart);
  const [end, setEnd] = useState<Date | undefined>(initialEnd);

  useEffect(() => {
    if (visible) {
      setStart(initialStart);
      setEnd(initialEnd);
    }
  }, [visible, initialStart, initialEnd]);

  const title =
    kind === 'wake' ? t('timeline.editWake') : t('timeline.editNap');

  const canSave = () => {
    if (kind === 'wake') {
      return end !== undefined && end.getTime() !== initialEnd?.getTime();
    }
    if (!start || !end) return false;
    if (end.getTime() <= start.getTime()) return false;
    return (
      start.getTime() !== initialStart?.getTime() ||
      end.getTime() !== initialEnd?.getTime()
    );
  };

  const handleSave = () => {
    if (kind === 'wake') {
      if (end) onSave({ endedAt: end.toISOString() });
    } else {
      if (start && end)
        onSave({ startedAt: start.toISOString(), endedAt: end.toISOString() });
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text variant="title" style={styles.title}>
        {title}
      </Text>

      {kind === 'nap' ? (
        <View style={styles.pickerBlock}>
          <Text variant="eyebrow" tone="tertiary" style={styles.pickerLabel}>
            {t('timeline.startTime')}
          </Text>
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={start ?? new Date()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              textColor={colors.text.primary}
              themeVariant="dark"
              onChange={(_, d) => d && setStart(d)}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.pickerBlock}>
        <Text variant="eyebrow" tone="tertiary" style={styles.pickerLabel}>
          {kind === 'wake' ? t('timeline.wake') : t('timeline.endTime')}
        </Text>
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={end ?? new Date()}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            textColor={colors.text.primary}
            themeVariant="dark"
            onChange={(_, d) => d && setEnd(d)}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title={t('profile.save')}
          onPress={handleSave}
          disabled={!canSave()}
        />
        <View style={{ height: spacing.sm }} />
        <Button title={t('profile.cancel')} variant="ghost" onPress={onClose} />
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
  pickerLabel: {
    marginBottom: spacing.xs,
  },
  pickerWrap: {
    alignItems: 'center',
  },
  actions: {
    marginTop: spacing.lg,
  },
});
