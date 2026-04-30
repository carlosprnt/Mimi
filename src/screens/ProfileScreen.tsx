import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
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

const CONFIRM_PANEL_HEIGHT = 280;
const ANIM_OPEN = 380;
const ANIM_CLOSE = 260;

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
  const { height: screenHeight } = useWindowDimensions();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const slide = useSharedValue(0);

  useEffect(() => {
    slide.value = withTiming(confirmOpen ? 1 : 0, {
      duration: confirmOpen ? ANIM_OPEN : ANIM_CLOSE,
      easing: confirmOpen
        ? Easing.out(Easing.cubic)
        : Easing.in(Easing.cubic),
    });
  }, [confirmOpen, slide]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          slide.value,
          [0, 1],
          [0, -CONFIRM_PANEL_HEIGHT],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const blurStyle = useAnimatedStyle(() => ({
    opacity: interpolate(slide.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const panelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(slide.value, [0, 0.6, 1], [0, 0.4, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          slide.value,
          [0, 1],
          [40, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

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

  const closeConfirm = () => {
    if (deleting) return;
    setConfirmOpen(false);
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

      <View style={styles.bodyArea}>
        {/* Confirmation panel sits at the bottom of the body area,
            behind the scroll content. When the user taps "Eliminar
            cuenta" the scroll lifts up to reveal it. */}
        <Animated.View
          pointerEvents={confirmOpen ? 'auto' : 'none'}
          style={[styles.confirmPanel, panelStyle]}
        >
          <Text variant="title" align="center" style={styles.confirmTitle}>
            {t('profile.deleteAccountConfirmTitle')}
          </Text>
          <Text
            variant="callout"
            tone="secondary"
            align="center"
            style={styles.confirmBody}
          >
            {t('profile.deleteAccountConfirmBody')}
          </Text>
          <Button title={t('profile.cancel')} onPress={closeConfirm} />
          <View style={styles.confirmGap} />
          <Button
            title={t('profile.deleteAccountConfirmCta')}
            variant="destructive"
            onPress={onConfirmDelete}
            loading={deleting}
          />
        </Animated.View>

        {/* Scrollable settings content — translates up when confirm
            opens. The blur overlay on top dims the screen visually
            while the user makes a choice. */}
        <Animated.View style={[StyleSheet.absoluteFill, bodyStyle]}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            scrollEnabled={!confirmOpen}
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

          <Animated.View
            pointerEvents={confirmOpen ? 'auto' : 'none'}
            style={[StyleSheet.absoluteFillObject, blurStyle]}
          >
            <BlurView
              intensity={28}
              tint="dark"
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View
              style={[StyleSheet.absoluteFillObject, styles.tint]}
              pointerEvents="none"
            />
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={closeConfirm}
            />
          </Animated.View>
        </Animated.View>
      </View>

      <Sheet visible={signOutOpen} onClose={() => setSignOutOpen(false)}>
        <Text variant="title" align="center" style={styles.sheetTitle}>
          {t('drawer.signOutConfirmTitle')}
        </Text>
        <Text variant="callout" tone="secondary" align="center" style={styles.sheetBody}>
          {t('drawer.signOutConfirmBody')}
        </Text>
        <Button title={t('common.no')} onPress={() => setSignOutOpen(false)} />
        <View style={styles.sheetGap} />
        <Button
          title={t('drawer.signOutConfirmCta')}
          variant="destructive"
          onPress={onConfirmSignOut}
        />
      </Sheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  bodyArea: {
    flex: 1,
    overflow: 'hidden',
  },
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
  confirmPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: CONFIRM_PANEL_HEIGHT,
    paddingHorizontal: screenGutter,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    justifyContent: 'flex-start',
  },
  confirmTitle: {
    marginBottom: spacing.sm,
  },
  confirmBody: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  confirmGap: {
    height: spacing.sm,
  },
  tint: {
    backgroundColor: 'rgba(7, 11, 31, 0.30)',
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
