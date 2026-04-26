import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import {
  Screen,
  HeaderBar,
  Card,
  ListRow,
  SectionLabel,
  Text,
  Button,
  NameEditSheet,
  DobEditSheet,
  PrematurityEditSheet,
  DeleteChildSheet,
} from '@/components';
import { colors, spacing, screenGutter } from '@/theme';
import { useActiveBaby, useBabyStore } from '@/state/babyStore';
import { useSleepStore } from '@/state/sleepStore';
import { useCareEventStore } from '@/state/careEventStore';
import { ageLabel } from '@/logic/age';
import { DrawerParamList } from '@/navigation/types';
import { t } from '@/i18n';

type EditingField = 'name' | 'dob' | 'prematurity' | 'delete' | null;

export const ProfileScreen: React.FC = () => {
  const navigation =
    useNavigation<DrawerNavigationProp<DrawerParamList, 'Profile'>>();
  const baby = useActiveBaby();
  const preferences = useBabyStore((s) => s.preferences);
  const setPreferences = useBabyStore((s) => s.setPreferences);
  const updateBaby = useBabyStore((s) => s.updateBaby);
  const removeBaby = useBabyStore((s) => s.removeBaby);
  const dropBabySessions = useSleepStore((s) => s.dropBaby);
  const dropBabyCareEvents = useCareEventStore((s) => s.dropBaby);

  const [editing, setEditing] = useState<EditingField>(null);
  const close = () => setEditing(null);

  if (!baby) return null;

  const dob = new Date(baby.dateOfBirth);

  const onSaveName = (name: string) => {
    updateBaby(baby.id, { name });
    close();
  };
  const onSaveDob = (date: Date) => {
    updateBaby(baby.id, { dateOfBirth: date.toISOString() });
    close();
  };
  const onSavePrematurity = (weeks: number | undefined) => {
    updateBaby(baby.id, { prematureWeeks: weeks });
    close();
  };
  const onConfirmDelete = () => {
    const babyId = baby.id;
    close();
    removeBaby(babyId);
    dropBabySessions(babyId);
    dropBabyCareEvents(babyId);
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <Screen>
      <HeaderBar
        title={t('profile.title')}
        leading={{
          glyph: '‹',
          label: t('common.back'),
          onPress: () => navigation.navigate('Home'),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel label={t('profile.baby')} />
        <Card padded={false}>
          <View style={styles.inner}>
            <ListRow
              label={t('profile.name')}
              value={baby.name}
              onPress={() => setEditing('name')}
            />
            <ListRow
              label={t('profile.dob')}
              value={dob.toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              caption={ageLabel(baby)}
              onPress={() => setEditing('dob')}
            />
            <ListRow
              label={t('profile.bornEarly')}
              value={
                baby.prematureWeeks
                  ? t('profile.weeks', { count: baby.prematureWeeks })
                  : t('common.no')
              }
              onPress={() => setEditing('prematurity')}
              showDivider={false}
            />
          </View>
        </Card>

        <SectionLabel label={t('profile.preferences')} />
        <Card padded={false}>
          <View style={styles.inner}>
            <ListRow
              label={t('profile.clock24h')}
              trailing={
                <Switch
                  value={preferences.use24h}
                  onValueChange={(v) => setPreferences({ use24h: v })}
                  trackColor={{ false: colors.border.strong, true: colors.accent.base }}
                  thumbColor={colors.text.primary}
                  ios_backgroundColor={colors.border.strong}
                />
              }
            />
            <ListRow
              label={t('profile.reminders')}
              trailing={
                <Switch
                  value={preferences.remindersEnabled}
                  onValueChange={(v) => setPreferences({ remindersEnabled: v })}
                  trackColor={{ false: colors.border.strong, true: colors.accent.base }}
                  thumbColor={colors.text.primary}
                  ios_backgroundColor={colors.border.strong}
                />
              }
            />
            <ListRow
              label={t('profile.bedtimeReminder')}
              trailing={
                <Switch
                  value={preferences.bedtimeReminder}
                  onValueChange={(v) => setPreferences({ bedtimeReminder: v })}
                  trackColor={{ false: colors.border.strong, true: colors.accent.base }}
                  thumbColor={colors.text.primary}
                  ios_backgroundColor={colors.border.strong}
                />
              }
              showDivider={false}
            />
          </View>
        </Card>

        <SectionLabel label={t('profile.about')} />
        <Card padded={false}>
          <View style={styles.inner}>
            <ListRow label={t('profile.version')} value="0.1.0" showDivider={false} />
          </View>
        </Card>

        <SectionLabel label={t('profile.danger')} />
        <Button
          title={t('profile.deleteChild')}
          variant="dangerGhost"
          onPress={() => setEditing('delete')}
          style={styles.deleteButton}
        />

        <Text
          variant="footnote"
          tone="tertiary"
          align="center"
          style={styles.note}
        >
          {t('profile.disclaimer')}
        </Text>
      </ScrollView>

      <NameEditSheet
        visible={editing === 'name'}
        initial={baby.name}
        onClose={close}
        onSave={onSaveName}
      />
      <DobEditSheet
        visible={editing === 'dob'}
        initial={dob}
        onClose={close}
        onSave={onSaveDob}
      />
      <PrematurityEditSheet
        visible={editing === 'prematurity'}
        initial={baby.prematureWeeks}
        onClose={close}
        onSave={onSavePrematurity}
      />
      <DeleteChildSheet
        visible={editing === 'delete'}
        baby={baby}
        onClose={close}
        onConfirm={onConfirmDelete}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: screenGutter,
    paddingBottom: spacing.huge,
  },
  inner: {
    paddingHorizontal: spacing.lg,
  },
  deleteButton: {
    alignSelf: 'stretch',
  },
  note: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
});
