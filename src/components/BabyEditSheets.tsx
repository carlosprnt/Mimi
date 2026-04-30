import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Sheet } from './Sheet';
import { Text } from './Text';
import { Button } from './Button';
import { colors, fonts, radii, spacing, typography } from '@/theme';
import { Baby } from '@/logic/age';
import { t, type TranslationKey } from '@/i18n';

interface NameSheetProps {
  visible: boolean;
  initial: string;
  onClose: () => void;
  onSave: (name: string) => void;
}

export const NameEditSheet: React.FC<NameSheetProps> = ({
  visible,
  initial,
  onClose,
  onSave,
}) => {
  const [value, setValue] = useState(initial);

  React.useEffect(() => {
    if (visible) setValue(initial);
  }, [visible, initial]);

  const trimmed = value.trim();

  return (
    <Sheet visible={visible} onClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text variant="title" style={styles.title}>
          {t('profile.editName')}
        </Text>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder={t('onboarding.name.placeholder')}
          placeholderTextColor={colors.text.tertiary}
          autoFocus
          autoCapitalize="words"
          autoCorrect={false}
          selectionColor={colors.accent.base}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (trimmed.length > 0) onSave(trimmed);
          }}
          style={styles.input}
        />
        <View style={styles.actions}>
          <Button
            title={t('profile.save')}
            onPress={() => onSave(trimmed)}
            disabled={trimmed.length === 0 || trimmed === initial.trim()}
          />
          <View style={{ height: spacing.sm }} />
          <Button
            title={t('profile.cancel')}
            variant="dangerGhost"
            onPress={onClose}
          />
        </View>
      </KeyboardAvoidingView>
    </Sheet>
  );
};

interface DobSheetProps {
  visible: boolean;
  initial: Date;
  onClose: () => void;
  onSave: (date: Date) => void;
}

export const DobEditSheet: React.FC<DobSheetProps> = ({
  visible,
  initial,
  onClose,
  onSave,
}) => {
  const [value, setValue] = useState<Date>(initial);

  React.useEffect(() => {
    if (visible) setValue(initial);
  }, [visible, initial]);

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text variant="title" style={styles.title}>
        {t('profile.editDob')}
      </Text>
      <View style={styles.pickerWrap}>
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          minimumDate={new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 6)}
          textColor={colors.text.primary}
          themeVariant="dark"
          onChange={(_, d) => {
            if (d) setValue(d);
          }}
        />
      </View>
      <View style={styles.actions}>
        <Button
          title={t('profile.save')}
          onPress={() => onSave(value)}
          disabled={value.getTime() === initial.getTime()}
        />
        <View style={{ height: spacing.sm }} />
        <Button title={t('profile.cancel')} variant="dangerGhost" onPress={onClose} />
      </View>
    </Sheet>
  );
};

interface PrematuritySheetProps {
  visible: boolean;
  initial?: number;
  onClose: () => void;
  onSave: (weeks: number | undefined) => void;
}

const PREMATURITY_OPTIONS: { labelKey: TranslationKey; value: number }[] = [
  { labelKey: 'onboarding.prematurity.options.onTime', value: 0 },
  { labelKey: 'onboarding.prematurity.options.weeks2', value: 2 },
  { labelKey: 'onboarding.prematurity.options.weeks4', value: 4 },
  { labelKey: 'onboarding.prematurity.options.weeks6', value: 6 },
  { labelKey: 'onboarding.prematurity.options.weeks8', value: 8 },
];

export const PrematurityEditSheet: React.FC<PrematuritySheetProps> = ({
  visible,
  initial,
  onClose,
  onSave,
}) => {
  const [selected, setSelected] = useState<number>(initial ?? 0);

  React.useEffect(() => {
    if (visible) setSelected(initial ?? 0);
  }, [visible, initial]);

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text variant="title" style={styles.title}>
        {t('profile.editPrematurity')}
      </Text>
      <View style={styles.optionList}>
        {PREMATURITY_OPTIONS.map((opt) => {
          const isSelected = opt.value === selected;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setSelected(opt.value)}
              style={({ pressed }) => [
                styles.option,
                isSelected && styles.optionSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text
                variant="body"
                tone={isSelected ? 'primary' : 'secondary'}
                style={isSelected ? styles.optionLabelSelected : undefined}
              >
                {t(opt.labelKey)}
              </Text>
              {isSelected ? (
                <Text variant="body" tone="accent">
                  ✓
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <View style={styles.actions}>
        <Button
          title={t('profile.save')}
          onPress={() => onSave(selected > 0 ? selected : undefined)}
          disabled={selected === (initial ?? 0)}
        />
        <View style={{ height: spacing.sm }} />
        <Button title={t('profile.cancel')} variant="dangerGhost" onPress={onClose} />
      </View>
    </Sheet>
  );
};

interface DeleteSheetProps {
  visible: boolean;
  baby: Baby;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteChildSheet: React.FC<DeleteSheetProps> = ({
  visible,
  baby,
  onClose,
  onConfirm,
}) => {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text variant="title" style={styles.title}>
        {t('profile.deleteChildConfirmTitle', { name: baby.name })}
      </Text>
      <Text variant="callout" tone="secondary" style={styles.body}>
        {t('profile.deleteChildConfirmBody')}
      </Text>
      <View style={styles.actions}>
        <Button title={t('profile.cancel')} onPress={onClose} />
        <View style={{ height: spacing.sm }} />
        <Button
          title={t('profile.delete')}
          variant="destructive"
          onPress={onConfirm}
        />
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  body: {
    marginBottom: spacing.xl,
  },
  input: {
    ...typography.title,
    color: colors.text.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(168, 165, 230, 0.10)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(168, 165, 230, 0.28)',
    marginBottom: spacing.lg,
  },
  pickerWrap: {
    alignItems: 'center',
  },
  optionList: {
    gap: spacing.sm,
  },
  option: {
    height: 52,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg.sunken,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSelected: {
    borderColor: colors.accent.base,
    borderWidth: 1,
  },
  optionLabelSelected: {
    fontFamily: fonts.medium,
  },
  pressed: {
    opacity: 0.7,
  },
  actions: {
    marginTop: spacing.xl,
  },
});
