import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  useNavigation,
  useRoute,
  DrawerActions,
} from '@react-navigation/native';
import type {
  DrawerNavigationProp,
  DrawerScreenProps,
} from '@react-navigation/drawer';
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
import { spacing, screenGutter } from '@/theme';
import { useBabyStore } from '@/state/babyStore';
import { useSleepStore } from '@/state/sleepStore';
import { useCareEventStore } from '@/state/careEventStore';
import { ageLabel } from '@/logic/age';
import { DrawerParamList } from '@/navigation/types';
import { t } from '@/i18n';

type EditingField = 'name' | 'dob' | 'prematurity' | 'delete' | null;

type Props = DrawerScreenProps<DrawerParamList, 'EditBaby'>;

export const BabyEditScreen: React.FC = () => {
  const navigation =
    useNavigation<DrawerNavigationProp<DrawerParamList, 'EditBaby'>>();
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
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <Screen backdrop="night">
      <HeaderBar
        title={baby.name}
        leading={{
          icon: 'arrow-back',
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

        <SectionLabel label={t('profile.danger')} />
        <Button
          title={t('profile.deleteChild')}
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
  },
  inner: {
    paddingHorizontal: spacing.lg,
  },
  deleteButton: {
    alignSelf: 'stretch',
  },
});
