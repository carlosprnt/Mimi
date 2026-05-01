import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  LiftConfirm,
  SignOutIcon,
} from '@/components';
import { colors, fonts, spacing, screenGutter } from '@/theme';
import { useBabyStore } from '@/state/babyStore';
import { useSleepStore } from '@/state/sleepStore';
import { useCareEventStore } from '@/state/careEventStore';
import { useAuthStore } from '@/state/authStore';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import {
  deleteAccount,
  isAppleSignInAvailable,
  signInWithApple,
  signInWithGoogle,
  signOut as supabaseSignOut,
} from '@/services/auth';
import { pushLocalToRemote } from '@/services/pushLocalToRemote';
import { wipeLocalData } from '@/services/wipeLocalData';
import { haptics } from '@/logic/haptics';
import { MainStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

type ConfirmMode = 'closed' | 'delete-account' | 'sign-out';

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

  const [mode, setMode] = useState<ConfirmMode>('closed');
  const [deleting, setDeleting] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  // After a guest user signs in from this screen, push their local
  // bebés / sesiones / eventos / preferencias up to Supabase so they're
  // bound to the new account. We only fire once per signed-in user
  // change; the auth store's user.id is the dependency.
  const lastPushedUserIdRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (!authedUser) {
      lastPushedUserIdRef.current = null;
      return;
    }
    if (lastPushedUserIdRef.current === authedUser.id) return;
    lastPushedUserIdRef.current = authedUser.id;
    void pushLocalToRemote(authedUser.id);
  }, [authedUser]);

  const onApple = async () => {
    if (busy) return;
    haptics.light();
    setBusy(true);
    const result = await signInWithApple();
    setBusy(false);
    if (!result.ok && result.reason !== 'cancelled') {
      Alert.alert(
        t('onboarding.welcome.appleAlertTitle'),
        result.message ?? t('onboarding.welcome.googleErrorFallback'),
      );
    }
  };

  const onGoogle = async () => {
    if (busy) return;
    haptics.light();
    setBusy(true);
    const result = await signInWithGoogle();
    setBusy(false);
    if (!result.ok && result.reason !== 'cancelled') {
      Alert.alert(
        t('onboarding.welcome.googleAlertTitle'),
        result.message ?? t('onboarding.welcome.googleErrorFallback'),
      );
    }
  };

  const closeConfirm = () => {
    if (deleting) return;
    setMode('closed');
  };

  const onConfirmSignOut = async () => {
    haptics.warning();
    setMode('closed');
    void supabaseSignOut();
    // Wipe the device's snapshot of this account so that
    //   1. another person handed the phone doesn't see the previous
    //      user's bebés / sessions while signed-out, and
    //   2. a guest onboarding from this device doesn't accidentally
    //      push the previous user's data into a brand-new account.
    // The next sign-in re-hydrates everything from Supabase.
    resetBabies();
    resetSleep();
    resetCare();
    clearOnboardingDraft();
    signOutAuth();
    await wipeLocalData();
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
    setMode('closed');
    if (!result.ok) {
      Alert.alert(t('profile.deleteAccountFailed'), result.message);
      return;
    }
    // Server-side data is gone. Now scrub every local trace before
    // routing back to onboarding: in-memory stores, persisted Zustand
    // slices in AsyncStorage, and the widget App Group payload.
    resetBabies();
    resetSleep();
    resetCare();
    clearOnboardingDraft();
    signOutAuth();
    await wipeLocalData();
    const parent = navigation.getParent();
    parent?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'OnboardingWelcome' }],
      }),
    );
  };

  const confirmConfig =
    mode === 'delete-account'
      ? {
          title: t('profile.deleteAccountConfirmTitle'),
          body: t('profile.deleteAccountConfirmBody'),
          destructive: t('profile.deleteAccountConfirmCta'),
          onConfirm: onConfirmDelete,
        }
      : mode === 'sign-out'
        ? {
            title: t('drawer.signOutConfirmTitle'),
            body: t('drawer.signOutConfirmBody'),
            destructive: t('drawer.signOutConfirmCta'),
            onConfirm: onConfirmSignOut,
          }
        : null;

  return (
    <Screen backdrop="night">
      <LiftConfirm
        open={mode !== 'closed'}
        onClose={closeConfirm}
        title={confirmConfig?.title ?? ''}
        body={confirmConfig?.body}
        destructiveLabel={confirmConfig?.destructive ?? ''}
        onConfirm={confirmConfig?.onConfirm ?? (() => {})}
        busy={mode === 'delete-account' && deleting}
      >
        <HeaderBar
          title={t('profile.title')}
          leading={{
            icon: 'arrow-back',
            label: t('common.back'),
            onPress: () => navigation.goBack(),
          }}
        />

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          scrollEnabled={mode === 'closed'}
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
                    {authedUser?.email ??
                      authedUser?.name ??
                      t('drawer.accountLocal')}
                  </Text>
                </View>
              </View>
              <View style={styles.accountDivider} />
              {authedUser ? (
                <Pressable
                  onPress={() => setMode('sign-out')}
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
              ) : (
                <View style={styles.signInBlock}>
                  <Text
                    variant="callout"
                    tone="primary"
                    style={styles.signInTitle}
                  >
                    {t('drawer.signInToSync')}
                  </Text>
                  <Text
                    variant="footnote"
                    tone="tertiary"
                    style={styles.signInCaption}
                  >
                    {t('drawer.signInCaption')}
                  </Text>
                  {appleAvailable ? (
                    <Pressable
                      onPress={onApple}
                      disabled={busy}
                      style={({ pressed }) => [
                        styles.authBtn,
                        pressed && styles.authBtnPressed,
                        busy && styles.authBtnDisabled,
                      ]}
                    >
                      <Ionicons
                        name="logo-apple"
                        size={18}
                        color="#000000"
                      />
                      <Text style={styles.authBtnLabel}>
                        {t('onboarding.summary.apple')}
                      </Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={onGoogle}
                    disabled={busy}
                    style={({ pressed }) => [
                      styles.authBtn,
                      pressed && styles.authBtnPressed,
                      busy && styles.authBtnDisabled,
                    ]}
                  >
                    <Ionicons
                      name="logo-google"
                      size={18}
                      color="#000000"
                    />
                    <Text style={styles.authBtnLabel}>
                      {t('onboarding.summary.google')}
                    </Text>
                  </Pressable>
                </View>
              )}
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
            onPress={() => setMode('delete-account')}
            style={styles.deleteAccount}
          />
        </ScrollView>
      </LiftConfirm>
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
  signInBlock: {
    paddingTop: spacing.xs,
    gap: spacing.sm,
  },
  signInTitle: {
    fontFamily: fonts.semibold,
  },
  signInCaption: {
    marginBottom: spacing.xs,
  },
  authBtn: {
    height: 44,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  authBtnPressed: {
    opacity: 0.85,
  },
  authBtnDisabled: {
    opacity: 0.5,
  },
  authBtnLabel: {
    color: '#0E0F12',
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  pressed: { opacity: 0.6 },
});
