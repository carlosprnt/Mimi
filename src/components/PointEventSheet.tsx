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
  onClose: () => void;
  onSave: (time: Date) => void;
  onDelete?: () => void;
}

export const PointEventSheet: React.FC<PointEventSheetProps> = ({
  visible,
  title,
  initial,
  onClose,
  onSave,
  onDelete,
}) => {
  const [value, setValue] = useState<Date>(initial);

  useEffect(() => {
    if (visible) setValue(initial);
  }, [visible, initial]);

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text variant="title" style={styles.title}>
        {title}
      </Text>
      <Text variant="eyebrow" tone="tertiary" style={styles.label}>
        {t('timeline.time')}
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
      <View style={styles.actions}>
        <Button title={t('profile.save')} onPress={() => onSave(value)} />
        <View style={{ height: spacing.sm }} />
        <Button title={t('profile.cancel')} variant="ghost" onPress={onClose} />
        {onDelete ? (
          <>
            <View style={{ height: spacing.sm }} />
            <Button
              title={t('timeline.deleteEvent')}
              variant="ghost"
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
