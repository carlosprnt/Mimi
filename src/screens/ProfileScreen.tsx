import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import {
  Screen,
  HeaderBar,
  Card,
  ListRow,
  SectionLabel,
  Text,
  Button,
  Sheet,
} from '@/components';
import { colors, spacing, screenGutter } from '@/theme';
import { useBabyStore } from '@/state/babyStore';
import { useSleepStore } from '@/state/sleepStore';
import { useCareEventStore } from '@/state/careEventStore';
import { useAuthStore } from '@/state/authStore';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { deleteAccount } from '@/services/auth';
import { DrawerParamList } from '@/navigation/types';
import { t } from '@/i18n';

export const ProfileScreen: React.FC = () => {
  const navigation =
    useNavigation<DrawerNavigationProp<DrawerParamList, 'Profile'>>();
  const preferences = useBabyStore((s) => s.preferences);
  const setPreferences = useBabyStore((s) => s.setPreferences);
  const resetBabies = useBabyStore((s) => s.reset);
  const resetSleep = useSleepStore((s) => s.resetAll);
  const resetCare = useCareEventStore((s) => s.resetAll);
  const signOutAuth = useAuthStore((s) => s.signOut);
  const clearOnboardingDraft = useOnboardingDraft((s) => s.clear);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onConfirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    const result = await deleteAccount();
    setDeleting(false);
    setConfirmOpen(false);
    if (!result.ok) {
      Alert.alert(t('profile.deleteAccountFailed'), result.message);
      return;
    }
    resetBabies();
    resetSleep();
    resetCare();
    clearOnboardingDraft();
    signOutAuth();
    const parent = navigation.getParent();
    parent?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'OnboardingWelcome' }],
      }),
    );
  };

  return (
    <Screen backdrop="night">
      <HeaderBar
        title={t('profile.title')}
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
        <SectionLabel label={t('profile.preferences')} />
        <Card padded={false}>
          <View style={styles.inner}>
            <ListRow
              label={t('profile.clock24h')}
              trailing={
                <Switch
                  value={preferences.use24h}
                  onValueChange={(v) => setPreferences({ use24h: v })}
                  trackColor={{ false: colors.border.strong, true: colors.accent.strong }}
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
                  trackColor={{ false: colors.border.strong, true: colors.accent.strong }}
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
                  trackColor={{ false: colors.border.strong, true: colors.accent.strong }}
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

        <Text
          variant="footnote"
          tone="tertiary"
          align="center"
          style={styles.note}
        >
          {t('profile.disclaimer')}
        </Text>

        <Button
          title={t('profile.deleteAccount')}
          variant="dangerGhost"
          onPress={() => setConfirmOpen(true)}
          style={styles.deleteAccount}
        />
      </ScrollView>

      <Sheet visible={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <Text variant="title" align="center" style={styles.sheetTitle}>
          {t('profile.deleteAccountConfirmTitle')}
        </Text>
        <Text
          variant="callout"
          tone="secondary"
          align="center"
          style={styles.sheetBody}
        >
          {t('profile.deleteAccountConfirmBody')}
        </Text>
        <Button
          title={t('profile.deleteAccountConfirmCta')}
          variant="destructive"
          onPress={onConfirmDelete}
          loading={deleting}
        />
        <View style={styles.sheetGap} />
        <Button
          title={t('profile.cancel')}
          variant="dangerGhost"
          onPress={() => setConfirmOpen(false)}
          disabled={deleting}
        />
      </Sheet>
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
  note: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  deleteAccount: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
  },
  sheetTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sheetBody: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  sheetGap: {
    height: spacing.sm,
  },
});
