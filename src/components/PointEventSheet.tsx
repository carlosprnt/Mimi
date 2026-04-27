import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Sheet } from './Sheet';
import { Text } from './Text';
import { Button } from './Button';
import { TimeHero } from './TimeHero';
import { TimeWheelView } from './TimeWheelView';
import { spacing } from '@/theme';
import { useBabyStore } from '@/state/babyStore';
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

type PickerSide = 'start' | 'end' | null;

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
  const use24h = useBabyStore((s) => s.preferences.use24h);
  const [value, setValue] = useState<Date>(initial);
  const [endValue, setEndValue] = useState<Date | undefined>(initialEnd);
  const [picker, setPicker] = useState<PickerSide>(null);

  useEffect(() => {
    if (visible) {
      setValue(initial);
      setEndValue(initialEnd);
      setPicker(null);
    }
  }, [visible, initial, initialEnd]);

  const handleSave = () => {
    if (withEnd) {
      let end = endValue;
      if (end && end.getTime() <= value.getTime()) {
        end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
      }
      onSave(value, end);
    } else {
      onSave(value);
    }
  };

  const pickerInitial =
    picker === 'start'
      ? value
      : picker === 'end'
        ? (endValue ?? value)
        : value;

  const onPickerConfirm = (next: Date) => {
    if (picker === 'start') setValue(next);
    else if (picker === 'end') setEndValue(next);
    setPicker(null);
  };

  return (
    <Sheet visible={visible} onClose={onClose} variant="frosted">
      {picker === null ? (
        <>
          <Text variant="title" style={styles.title}>
            {title}
          </Text>

          <TimeHero
            primary={value}
            secondary={withEnd ? endValue : undefined}
            isRange={withEnd}
            use24h={use24h}
            onPressPrimary={() => setPicker('start')}
            onPressSecondary={withEnd ? () => setPicker('end') : undefined}
          />

          <View style={styles.actions}>
            <View style={styles.actionsRow}>
              <Button
                title={t('profile.cancel')}
                variant="subtle"
                style={styles.cancelButton}
                onPress={onClose}
              />
              <Button
                title={t('profile.save')}
                onPress={handleSave}
                style={styles.saveButton}
              />
            </View>
            {onDelete ? (
              <>
                <View style={{ height: spacing.md }} />
                <Button
                  title={t('timeline.deleteEvent')}
                  variant="dangerGhost"
                  onPress={onDelete}
                />
              </>
            ) : null}
          </View>
        </>
      ) : (
        <TimeWheelView
          initial={pickerInitial}
          use24h={use24h}
          onClose={() => setPicker(null)}
          onConfirm={onPickerConfirm}
        />
      )}
    </Sheet>
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
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});
