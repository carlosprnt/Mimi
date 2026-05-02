import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Screen,
  HeaderBar,
  HEADER_BAR_HEIGHT,
  Card,
  ListRow,
  Button,
  Text,
  Divider,
  DobEditSheet,
  PrematurityEditSheet,
  LiftConfirm,
} from '@/components';
import { colors, fonts, spacing, screenGutter } from '@/theme';
import { useBabyStore } from '@/state/babyStore';
import { useSleepStore } from '@/state/sleepStore';
import { useCareEventStore } from '@/state/careEventStore';
import { ageLabel } from '@/logic/age';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

type EditingField = 'dob' | 'prematurity' | 'delete' | null;

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

  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const [editing, setEditing] = useState<EditingField>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const nameInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (editingName) {
      setNameDraft(baby?.name ?? '');
      // Focus on next tick so the TextInput has mounted.
      setTimeout(() => nameInputRef.current?.focus(), 0);
    }
  }, [editingName, baby?.name]);

  const close = () => setEditing(null);

  if (!baby) return null;

  const dob = new Date(baby.dateOfBirth);
  const dismiss = () => navigation.goBack();

  const commitName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed.length > 0 && trimmed !== baby.name) {
      updateBaby(baby.id, { name: trimmed });
    }
    setEditingName(false);
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
    // Navigate back FIRST so the LiftConfirm closing animation is
    // never interrupted mid-flight by the screen unmount — that
    // race was crashing Reanimated on the native side.
    dismiss();
    removeBaby(id);
    dropBabySessions(id);
    dropBabyCareEvents(id);
  };

  return (
    <Screen backdrop="night" edges={['left', 'right']}>
      <LiftConfirm
        open={editing === 'delete'}
        onClose={close}
        title={t('profile.deleteChildConfirmTitle', { name: baby.name })}
        body={t('profile.deleteChildConfirmBody')}
        destructiveLabel={t('profile.deleteBaby')}
        onConfirm={onConfirmDelete}
      >
        <HeaderBar
          title={t('profile.babyEditTitle')}
          leading={{
            icon: 'arrow-back',
            label: t('common.back'),
            onPress: dismiss,
          }}
          scrollY={scrollY}
        />

        <Animated.ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + HEADER_BAR_HEIGHT + spacing.md },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={editing !== 'delete'}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          <Card padded={false} tone="night" style={styles.card}>
            <View style={styles.inner}>
              <Pressable
                onPress={() => setEditingName(true)}
                style={styles.nameRow}
              >
                <Text variant="body" tone="secondary" style={styles.nameLabel}>
                  {t('profile.name')}
                </Text>
                {editingName ? (
                  <TextInput
                    ref={nameInputRef}
                    value={nameDraft}
                    onChangeText={setNameDraft}
                    onBlur={commitName}
                    onSubmitEditing={commitName}
                    autoCapitalize="words"
                    autoCorrect={false}
                    selectionColor={colors.accent.base}
                    returnKeyType="done"
                    style={styles.nameInput}
                  />
                ) : (
                  <Text
                    variant="body"
                    tone="primary"
                    align="right"
                    numberOfLines={1}
                    style={styles.nameValue}
                  >
                    {baby.name}
                  </Text>
                )}
              </Pressable>
              <Divider />

              <ListRow
                label={t('profile.dob')}
                value={dob.toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                onPress={() => setEditing('dob')}
              />
              <View style={styles.disabledRow}>
                <ListRow
                  label={t('profile.age')}
                  value={ageLabel(baby)}
                />
              </View>
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
        </Animated.ScrollView>
      </LiftConfirm>

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
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: screenGutter,
    paddingBottom: spacing.huge,
  },
  card: {
    backgroundColor: 'rgba(19, 27, 58, 0.78)',
  },
  inner: {
    paddingHorizontal: spacing.lg,
  },
  nameRow: {
    minHeight: 52,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameLabel: {
    paddingRight: spacing.md,
  },
  nameValue: {
    flex: 1,
  },
  nameInput: {
    flex: 1,
    color: colors.text.primary,
    fontFamily: fonts.regular,
    fontSize: 16,
    textAlign: 'right',
    paddingVertical: 0,
  },
  deleteButton: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
  },
  disabledRow: {
    opacity: 0.45,
  },
});
