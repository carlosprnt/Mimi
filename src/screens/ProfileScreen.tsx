import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Screen,
  HeaderBar,
  HEADER_BAR_HEIGHT,
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
import { cancelAllBedtimeReminders } from '@/services/notifications';
import { ProBadge, useSubscription } from '@/subscription';
import { useDemoStore } from '@/state/demoStore';
import { DEMO_SCENARIOS } from '@/dev/demoScenarios';

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

  const {
    isPro,
    openPaywall,
    openManagement,
  } = useSubscription();

  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const [mode, setMode] = useState<ConfirmMode>('closed');
  const [deleting, setDeleting] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  // If the user downgraded from Pro to Free while a bedtime reminder
  // was scheduled, the OS-level notification keeps firing until we
  // cancel it. We don't touch the persisted flag (so the toggle
  // recovers automatically when they upgrade back) — only the
  // currently scheduled local notifications.
  useEffect(() => {
    if (!isPro && preferences.bedtimeReminder) {
      void cancelAllBedtimeReminders();
    }
  }, [isPro, preferences.bedtimeReminder]);

  const handleManage = async () => {
    const url = await openManagement();
    Linking.openURL(url ?? 'itms-apps://apps.apple.com/account/subscriptions').catch(
      () => {},
    );
  };

  const handleBedtimeToggle = (next: boolean) => {
    if (next && !isPro) {
      openPaywall('notifications');
      return;
    }
    setPreferences({ bedtimeReminder: next });
  };

  const bedtimeValue = isPro && preferences.bedtimeReminder;

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

  const onConfirmSignOut = () => {
    haptics.warning();
    // Navigate FIRST so ProfileScreen + LiftConfirm unmount cleanly.
    // Doing it after async work was triggering a Reanimated crash
    // when the closing-panel animation was interrupted by the
    // unmount.
    const parent = navigation.getParent();
    parent?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'OnboardingWelcome' }],
      }),
    );
    // Local state cleanup — synchronous, fast, no UI depends on the
    // outcome (ProfileScreen is already unmounting).
    signOutAuth();
    resetBabies();
    resetSleep();
    resetCare();
    clearOnboardingDraft();
    // Async cleanup in the background. If supabaseSignOut or the
    // AsyncStorage wipe throw, they can't take down a mounted view.
    void (async () => {
      try {
        await supabaseSignOut();
        await wipeLocalData();
      } catch {
        // best effort
      }
    })();
  };

  const onConfirmDelete = async () => {
    if (deleting) return;
    haptics.warning();
    setDeleting(true);
    const result = await deleteAccount();
    setDeleting(false);
    if (!result.ok) {
      setMode('closed');
      Alert.alert(t('profile.deleteAccountFailed'), result.message);
      return;
    }
    // Navigate first so Profile + its LiftConfirm unmount cleanly,
    // before we mutate stores or wipe storage.
    const parent = navigation.getParent();
    parent?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'OnboardingWelcome' }],
      }),
    );
    // Local state cleanup (synchronous, no UI mounted on it).
    signOutAuth();
    resetBabies();
    resetSleep();
    resetCare();
    clearOnboardingDraft();
    // Async wipe of AsyncStorage + widget App Group, fire-and-forget.
    void wipeLocalData();
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
    <Screen backdrop="night" edges={['left', 'right']}>
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
          scrollY={scrollY}
        />

        <Animated.ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + HEADER_BAR_HEIGHT },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={mode === 'closed'}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {isPro ? (
            <Card padded={false} tone="night" style={[styles.card, styles.proCard]}>
              <View style={styles.proInner}>
                <View style={styles.proHead}>
                  <Text variant="headline" tone="primary">
                    {t('pro.activeTitle')}
                  </Text>
                  <ProBadge tone="solid" />
                </View>
                <Text variant="callout" tone="secondary" style={styles.proBody}>
                  {t('pro.activeBody')}
                </Text>
                <View style={styles.proActions}>
                  <Button
                    title={t('pro.manage')}
                    onPress={handleManage}
                    variant="subtle"
                  />
                </View>
              </View>
            </Card>
          ) : (
            <Pressable
              onPress={() => openPaywall('settings')}
              accessibilityRole="button"
              style={({ pressed }) => [pressed && styles.pressedCard]}
            >
              <Card padded={false} tone="night" style={[styles.card, styles.proCard]}>
                <View style={styles.proInner}>
                  <View style={styles.proHead}>
                    <Text variant="headline" tone="primary">
                      {t('pro.settingsTitle')}
                    </Text>
                    <ProBadge />
                  </View>
                  <Text variant="callout" tone="secondary" style={styles.proBody}>
                    {t('pro.settingsBody')}
                  </Text>
                  <View style={styles.proActions}>
                    <Button
                      title={t('pro.unlock')}
                      onPress={() => openPaywall('settings')}
                    />
                  </View>
                </View>
              </Card>
            </Pressable>
          )}

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
                label={t('profile.bedtimeReminder')}
                trailing={
                  <View style={styles.switchTrail}>
                    {!isPro ? <ProBadge /> : null}
                    <Switch
                      value={bedtimeValue}
                      onValueChange={handleBedtimeToggle}
                      trackColor={{ false: colors.border.strong, true: colors.accent.strong }}
                      thumbColor={colors.text.primary}
                      ios_backgroundColor={colors.border.strong}
                    />
                  </View>
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

          <SectionLabel label={t('legal.sectionLabel')} />
          <Card padded={false} tone="night" style={styles.card}>
            <View style={styles.inner}>
              <ListRow
                label={t('legal.privacyRow')}
                onPress={() =>
                  navigation.getParent()?.navigate('LegalPrivacy')
                }
              />
              <ListRow
                label={t('legal.termsRow')}
                onPress={() =>
                  navigation.getParent()?.navigate('LegalTerms')
                }
              />
              <ListRow
                label={t('legal.supportRow')}
                onPress={() => Linking.openURL('mailto:hola@mimi.app')}
                showDivider={false}
              />
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

          {authedUser?.email === 'carlosprnt@gmail.com' && (
            <DevDemoSection />
          )}
        </Animated.ScrollView>
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
  proCard: {
    borderWidth: 1,
    borderColor: 'rgba(168, 165, 230, 0.22)',
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
  proInner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  proHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  proBody: {
    marginBottom: spacing.lg,
  },
  proActions: {
    marginTop: spacing.sm,
  },
  restoreNote: {
    marginTop: spacing.sm,
  },
  pressedCard: {
    opacity: 0.85,
  },
  switchTrail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});

// ---------------------------------------------------------------------------
// Developer-only demo mode section (visible only for carlosprnt@gmail.com)
// ---------------------------------------------------------------------------

const DevDemoSection: React.FC = () => {
  const active = useDemoStore((s) => s.active);
  const activate = useDemoStore((s) => s.activate);
  const restore = useDemoStore((s) => s.restore);

  return (
    <View style={devStyles.container}>
      <Text variant="eyebrow" tone="tertiary" style={devStyles.heading}>
        MODO DESARROLLADOR
      </Text>

      {active ? (
        <Pressable
          onPress={restore}
          style={({ pressed }) => [devStyles.restoreBtn, pressed && devStyles.pressed]}
        >
          <Ionicons name="refresh" size={14} color="#6FCE8C" />
          <Text variant="footnote" style={devStyles.restoreLabel}>
            Restaurar datos reales
          </Text>
        </Pressable>
      ) : null}

      <View style={devStyles.list}>
        {DEMO_SCENARIOS.map((s) => {
          const isActive = active === s.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => activate(s.id)}
              style={({ pressed }) => [
                devStyles.row,
                isActive && devStyles.rowActive,
                pressed && devStyles.pressed,
              ]}
            >
              <View style={devStyles.rowContent}>
                <Text variant="body" tone="primary" style={devStyles.rowLabel} numberOfLines={1}>
                  {s.label}
                </Text>
                <Text variant="footnote" tone="tertiary" numberOfLines={1}>
                  {s.description}
                </Text>
              </View>
              {isActive ? (
                <Ionicons name="checkmark-circle" size={18} color="#6FCE8C" />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const devStyles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  heading: {
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  restoreLabel: {
    color: '#6FCE8C',
    fontFamily: fonts.medium,
  },
  list: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    gap: spacing.sm,
  },
  rowActive: {
    backgroundColor: 'rgba(111, 206, 140, 0.08)',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.6,
  },
});
