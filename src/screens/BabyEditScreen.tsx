import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Screen,
  HeaderBar,
  Card,
  ListRow,
  Button,
  NameEditSheet,
  DobEditSheet,
  PrematurityEditSheet,
  DeleteChildSheet,
} from '@/components';
import { spacing, screenGutter } from '@/theme';
import { useBabyStore } from '@/state/babyStore';
import { useSleepStore } from '@/state/sleepStore';
import { useCareEventStore } from '@/state/careEventStore';
import { ageLabel } from '@/logic/age';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

type EditingField = 'name' | 'dob' | 'prematurity' | 'delete' | null;

type Props = NativeStackScreenProps<RootStackParamList, 'BabyEdit'>;

export const BabyEditScreen: React.FC = () => {
  const navigation = useNavigation<Props['navigation']>();
  const route = useRoute<Props['route']>();
  const babyId = route.params?.babyId;
  const baby = useBabyStore((s) =>
    s.babies.find((b) => b.id === babyId) ?? null,
  );
  const updateBaby = useBabyStore((s) => s.updateBaby);
  const removeBaby = useBabyStore((s) => s.removeBaby);
  const dropBabySessions = useSleepStore((s) => s.dropBaby);
  const dropBabyCareEvents = useCareEventStore((s) => s.dropBaby);

  const [editing, setEditing] = useState<EditingField>(null);
  const close = () => setEditing(null);

  if (!baby) return null;

  const dob = new Date(baby.dateOfBirth);
  const dismiss = () => navigation.goBack();

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
    const id = baby.id;
    close();
    removeBaby(id);
    dropBabySessions(id);
    dropBabyCareEvents(id);
    dismiss();
  };

  return (
    <Screen backdrop="night">
      <HeaderBar
        title={baby.name}
        leading={{
          icon: 'close',
          label: t('common.close'),
          onPress: dismiss,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Card padded={false} tone="night" style={styles.card}>
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
              onPress={() => setEditing('dob')}
            />
            <ListRow
              label={t('profile.age')}
              value={ageLabel(baby)}
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

        <Button
          title={t('profile.deleteBaby')}
          variant="dangerGhost"
          onPress={() => setEditing('delete')}
          style={styles.deleteButton}
        />
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
    paddingTop: spacing.md,
  },
  card: {
    backgroundColor: 'rgba(19, 27, 58, 0.78)',
  },
  inner: {
    paddingHorizontal: spacing.lg,
  },
  deleteButton: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
  },
});
