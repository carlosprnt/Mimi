import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Sheet } from './Sheet';
import { Text } from './Text';
import { Button } from './Button';
import { TimeHero } from './TimeHero';
import { TimeWheelSheet } from './TimeWheelSheet';
import { spacing } from '@/theme';
import { useBabyStore } from '@/state/babyStore';
import { t } from '@/i18n';

export type TimelineEditKind = 'wake' | 'nap' | 'activeStart';

interface TimelineEditSheetProps {
  visible: boolean;
  kind: TimelineEditKind;
  initialStart?: Date;
  initialEnd?: Date;
  onClose: () => void;
  onSave: (update: { startedAt?: string; endedAt?: string }) => void;
  onDelete?: () => void;
  title?: string;
}

type PickerSide = 'start' | 'end' | null;

export const TimelineEditSheet: React.FC<TimelineEditSheetProps> = ({
  visible,
  kind,
  initialStart,
  initialEnd,
  onClose,
  onSave,
  onDelete,
  title,
}) => {
  const use24h = useBabyStore((s) => s.preferences.use24h);
  const [start, setStart] = useState<Date | undefined>(initialStart);
  const [end, setEnd] = useState<Date | undefined>(initialEnd);
  const [picker, setPicker] = useState<PickerSide>(null);

  useEffect(() => {
    if (visible) {
      setStart(initialStart);
      setEnd(initialEnd);
      setPicker(null);
    }
  }, [visible, initialStart, initialEnd]);

  const resolvedTitle =
    title ??
    (kind === 'wake'
      ? t('timeline.editWake')
      : kind === 'activeStart'
        ? t('timeline.editStartTime')
        : t('timeline.editNap'));

  const canSave = () => {
    if (kind === 'wake') {
      return end !== undefined && end.getTime() !== initialEnd?.getTime();
    }
    if (kind === 'activeStart') {
      return start !== undefined && start.getTime() !== initialStart?.getTime();
    }
    if (!start || !end) return false;
    if (end.getTime() <= start.getTime()) return false;
    return (
      start.getTime() !== initialStart?.getTime() ||
      end.getTime() !== initialEnd?.getTime()
    );
  };

  const handleSave = () => {
    if (kind === 'wake' && end) {
      onSave({ endedAt: end.toISOString() });
    } else if (kind === 'activeStart' && start) {
      onSave({ startedAt: start.toISOString() });
    } else if (kind === 'nap' && start && end) {
      onSave({ startedAt: start.toISOString(), endedAt: end.toISOString() });
    }
  };

  const isRange = kind === 'nap';
  const heroPrimary = kind === 'wake' ? end : start;
  const heroSecondary = kind === 'wake' ? undefined : end;

  const onPressPrimary =
    kind === 'wake'
      ? () => setPicker('end')
      : () => setPicker('start');

  const onPressSecondary = isRange ? () => setPicker('end') : undefined;

  const pickerInitial =
    picker === 'start'
      ? (start ?? new Date())
      : picker === 'end'
        ? (end ?? start ?? new Date())
        : new Date();

  const onPickerConfirm = (value: Date) => {
    if (picker === 'start') setStart(value);
    else if (picker === 'end') setEnd(value);
    setPicker(null);
  };

  return (
    <>
      <Sheet visible={visible} onClose={onClose}>
        <Text variant="title" style={styles.title}>
          {resolvedTitle}
        </Text>

        <TimeHero
          primary={heroPrimary}
          secondary={heroSecondary}
          isRange={isRange}
          use24h={use24h}
          onPressPrimary={onPressPrimary}
          onPressSecondary={onPressSecondary}
        />

        <View style={styles.actions}>
          <Button
            title={t('profile.save')}
            onPress={handleSave}
            disabled={!canSave()}
          />
          <View style={{ height: spacing.sm }} />
          <Button
            title={t('profile.cancel')}
            variant="ghost"
            onPress={onClose}
          />
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

      <TimeWheelSheet
        visible={picker !== null}
        initial={pickerInitial}
        use24h={use24h}
        onClose={() => setPicker(null)}
        onConfirm={onPickerConfirm}
      />
    </>
  );
};

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  actions: {
    marginTop: spacing.lg,
  },
});
