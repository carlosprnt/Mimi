import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Screen,
  HeaderBar,
  Card,
  ListRow,
  SectionLabel,
  Text,
  Button,
  Sheet,
  SignOutIcon,
} from '@/components';
import { colors, fonts, spacing, screenGutter } from '@/theme';
import { useBabyStore } from '@/state/babyStore';
import { useSleepStore } from '@/state/sleepStore';
import { useCareEventStore } from '@/state/careEventStore';
import { useAuthStore } from '@/state/authStore';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { deleteAccount, signOut as supabaseSignOut } from '@/services/auth';
import { haptics } from '@/logic/haptics';
import { MainStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

export const ProfileScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList, 'Profile'>>();
  const preferences = useBabyStore((s) => s.preferences);
  const setPreferences = useBabyStore((s) => s.setPreferences);
  const resetBabies = useBabyStore((s) => s.reset);
  const resetSleep = useSleepStore((s) => s.resetAll);
  const resetCare = useCareEventStore((s) => s.resetAll);
  const signOutAuth = useAuthStore((s) => s.signOut);
  const clearOnboardingDraft = useOnboardingDraft((s) => s.clear);

  const authedUser = useAuthStore((s) => s.user);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onConfirmSignOut = () => {
    haptics.warning();
    setSignOutOpen(false);
    void supabaseSignOut();
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

  const onConfirmDelete = async () => {
    if (deleting) return;
    haptics.warning();
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
        <Card padded={false} tone="night" style={styles.card}>
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

        <SectionLabel label={t('drawer.account')} />
        <Card padded={false} tone="night" style={styles.card}>
          <View style={styles.accountInner}>
            <View style={styles.accountTop}>
              {authedUser?.picture ? (
                <Image source={{ uri: authedUser.picture }} style={styles.accountAvatar} />
              ) : (
                <View style={styles.accountAvatar}>
                  <Text variant="body" tone="onAccent" style={styles.accountInitials}>
                    {(authedUser?.name ?? authedUser?.email ?? '·')
                      .trim()
                      .slice(0, 2)
                      .toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.accountInfo}>
                <Text variant="body" tone="primary" numberOfLines={1}>
                  {authedUser?.email ?? t('drawer.accountLocal')}
                </Text>
                {!authedUser ? (
                  <Text variant="footnote" tone="tertiary" numberOfLines={1}>
                    {t('drawer.accountLocalCaption')}
                  </Text>
                ) : null}
              </View>
            </View>
            {authedUser ? (
              <>
                <View style={styles.accountDivider} />
                <Pressable
                  onPress={() => setSignOutOpen(true)}
                  style={({ pressed }) => [
                    styles.signOutRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <SignOutIcon size={18} />
                  <Text variant="body" tone="danger">
                    {t('drawer.signOut')}
                  </Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </Card>

        <SectionLabel label={t('profile.about')} />
        <Card padded={false} tone="night" style={styles.card}>
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

      <Sheet visible={signOutOpen} onClose={() => setSignOutOpen(false)}>
        <Text variant="title" align="center" style={styles.sheetTitle}>
          {t('drawer.signOutConfirmTitle')}
        </Text>
        <Text variant="callout" tone="secondary" align="center" style={styles.sheetBody}>
          {t('drawer.signOutConfirmBody')}
        </Text>
        <Button
          title={t('drawer.signOutConfirmCta')}
          variant="destructive"
          onPress={onConfirmSignOut}
        />
        <View style={styles.sheetGap} />
        <Button
          title={t('common.no')}
          variant="dangerGhost"
          onPress={() => setSignOutOpen(false)}
        />
      </Sheet>

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
  card: {
    backgroundColor: 'rgba(19, 27, 58, 0.78)',
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
  accountInner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  accountTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  accountAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent.base,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  accountInitials: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  accountInfo: { flex: 1 },
  accountDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: spacing.sm,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  pressed: { opacity: 0.6 },
});
