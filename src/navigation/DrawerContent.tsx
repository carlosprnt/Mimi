import React, { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import {
  CommonActions,
  DrawerActions,
} from '@react-navigation/native';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Sheet, Button } from '@/components';
import { useBabyStore } from '@/state/babyStore';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { useAuthStore } from '@/state/authStore';
import { signOut as supabaseSignOut } from '@/services/auth';
import { ageLabel } from '@/logic/age';
import { colors, fonts, spacing } from '@/theme';
import { t } from '@/i18n';
import { DRAWER_SCALE_TO } from './DrawerSceneWrapper';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const PANEL_VERTICAL_INSET =
  (SCREEN_HEIGHT * (1 - DRAWER_SCALE_TO)) / 2;
const PANEL_RADIUS = 32;

type RouteName = 'Home' | 'History' | 'Profile';

interface NavItem {
  route: RouteName;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const DrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const insets = useSafeAreaInsets();
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const setActiveBabyId = useBabyStore((s) => s.setActiveBabyId);
  const clearOnboardingDraft = useOnboardingDraft((s) => s.clear);
  const signOutAuth = useAuthStore((s) => s.signOut);
  const authedUser = useAuthStore((s) => s.user);

  const [signOutOpen, setSignOutOpen] = useState(false);

  const selectBaby = (id: string) => {
    setActiveBabyId(id);
    props.navigation.closeDrawer();
  };

  const goAddChild = () => {
    props.navigation.closeDrawer();
    props.navigation
      .getParent()
      ?.navigate('OnboardingName', { mode: 'addChild' });
  };

  const goTo = (route: RouteName) => {
    props.navigation.navigate(route);
  };

  const handleSignOut = () => {
    // Sign-out NO destroys data anymore. Babies + sleep + care events
    // live in Supabase under the user account; when the parent signs in
    // again (same or another device) useSessionBootstrap re-hydrates the
    // local stores. Only the auth session and the in-progress onboarding
    // draft are wiped. The mismatched-user case is handled at hydrate
    // time (see useSessionBootstrap → setBabies on user change).
    setSignOutOpen(false);
    void supabaseSignOut();
    clearOnboardingDraft();
    signOutAuth();
    props.navigation.dispatch(DrawerActions.closeDrawer());
    const parent = props.navigation.getParent();
    parent?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'OnboardingWelcome' }],
      }),
    );
  };

  const currentRoute = props.state.routeNames[props.state.index];

  const navItems: NavItem[] = [
    { route: 'Home', label: t('nav.home'), icon: 'home-outline' },
    { route: 'History', label: t('nav.history'), icon: 'time-outline' },
    { route: 'Profile', label: t('nav.settings'), icon: 'settings-outline' },
  ];

  return (
    <View style={styles.outer}>
      <View style={styles.panel}>
        <LinearGradient
          colors={[colors.night.top, colors.night.mid, colors.night.bottom]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
        <DrawerContentScrollView
          {...props}
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top, spacing.xl) },
          ]}
        >
        <View style={styles.header}>
          <Text variant="title" tone="primary" style={styles.wordmark}>
            {t('drawer.wordmark')}
          </Text>
        </View>

        {babies.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text variant="callout" tone="tertiary">
              {t('drawer.noChildren')}
            </Text>
          </View>
        ) : (
          <View style={styles.childList}>
            {babies.map((baby) => {
              const isActive = baby.id === activeBabyId;
              return (
                <Pressable
                  key={baby.id}
                  onPress={() => selectBaby(baby.id)}
                  style={({ pressed }) => [
                    styles.childChip,
                    isActive && styles.childChipActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.avatar,
                      isActive && styles.avatarActive,
                    ]}
                  >
                    <Text
                      variant="body"
                      tone={isActive ? 'onAccent' : 'secondary'}
                      style={styles.avatarLetter}
                    >
                      {baby.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.childInfo}>
                    <Text
                      variant="body"
                      tone={isActive ? 'primary' : 'secondary'}
                      style={isActive ? styles.childNameActive : undefined}
                      numberOfLines={1}
                    >
                      {baby.name}
                    </Text>
                    <Text
                      variant="footnote"
                      tone="tertiary"
                      style={styles.childAge}
                      numberOfLines={1}
                    >
                      {ageLabel(baby)}
                    </Text>
                  </View>
                  {isActive ? (
                    <View style={styles.activeDot} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}

        <Pressable
          onPress={goAddChild}
          style={({ pressed }) => [styles.addRow, pressed && styles.pressed]}
        >
          <Ionicons
            name="add"
            size={20}
            color={colors.accent.base}
            style={styles.iconLead}
          />
          <Text variant="body" tone="accent" style={styles.addLabel}>
            {t('drawer.addChild')}
          </Text>
        </Pressable>

        <View style={styles.divider} />

        {navItems.map((item) => {
          const isActive = currentRoute === item.route;
          return (
            <Pressable
              key={item.route}
              onPress={() => goTo(item.route)}
              style={({ pressed }) => [
                styles.navRow,
                isActive && styles.navRowActive,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={isActive ? colors.accent.base : colors.text.secondary}
                style={styles.iconLead}
              />
              <Text
                variant="body"
                tone={isActive ? 'primary' : 'secondary'}
                style={isActive ? styles.navRowLabelActive : undefined}
              >
                {item.label}
              </Text>
              {isActive ? (
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.text.tertiary}
                  style={styles.chevron}
                />
              ) : null}
            </Pressable>
          );
        })}
        </DrawerContentScrollView>

        <View
          style={[
            styles.accountFooter,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
        >
          <View style={styles.accountDivider} />

          <Text variant="eyebrow" tone="tertiary" style={styles.accountEyebrow}>
            {t('drawer.account')}
          </Text>

          <View style={styles.accountRow}>
            <Ionicons
              name={authedUser ? 'person-circle-outline' : 'person-outline'}
              size={20}
              color={colors.text.secondary}
              style={styles.iconLead}
            />
            <View style={styles.accountInfo}>
              <Text variant="body" tone="secondary" numberOfLines={1}>
                {authedUser?.name ?? authedUser?.email ?? t('drawer.accountLocal')}
              </Text>
              <Text
                variant="footnote"
                tone="tertiary"
                numberOfLines={1}
                style={styles.accountCaption}
              >
                {authedUser
                  ? authedUser.provider === 'google'
                    ? 'Google'
                    : 'Apple'
                  : t('drawer.accountLocalCaption')}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => setSignOutOpen(true)}
            style={({ pressed }) => [
              styles.signOutRow,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={colors.danger.base}
              style={styles.iconLead}
            />
            <Text variant="body" tone="danger">
              {t('drawer.signOut')}
            </Text>
          </Pressable>
        </View>
      </View>

      <Sheet
        visible={signOutOpen}
        onClose={() => setSignOutOpen(false)}
      >
        <Text variant="title" style={styles.signOutSheetTitle}>
          {t('drawer.signOutConfirmTitle')}
        </Text>
        <Text
          variant="callout"
          tone="secondary"
          style={styles.signOutSheetBody}
        >
          {t('drawer.signOutConfirmBody')}
        </Text>
        <Button
          title={t('drawer.signOutConfirmCta')}
          variant="destructive"
          onPress={handleSignOut}
        />
        <View style={styles.signOutSheetGap} />
        <Button
          title={t('common.no')}
          variant="dangerGhost"
          onPress={() => setSignOutOpen(false)}
        />
      </Sheet>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    paddingVertical: PANEL_VERTICAL_INSET,
    paddingLeft: 4,
  },
  panel: {
    flex: 1,
    borderRadius: PANEL_RADIUS,
    backgroundColor: colors.night.bottom,
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  accountFooter: {
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  wordmark: {
    fontSize: 20,
    letterSpacing: 0,
    fontFamily: fonts.medium,
  },
  childList: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  childChipActive: {
    backgroundColor: 'rgba(168, 165, 230, 0.12)',
    borderColor: 'rgba(168, 165, 230, 0.25)',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  avatarActive: {
    backgroundColor: colors.accent.base,
    borderColor: colors.accent.base,
  },
  avatarLetter: {
    fontFamily: fonts.semibold,
  },
  childInfo: {
    flex: 1,
  },
  childNameActive: {
    fontFamily: fonts.medium,
  },
  childAge: {
    marginTop: 2,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.base,
  },
  emptyRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  addLabel: {
    fontFamily: fonts.medium,
  },
  iconLead: {
    width: 24,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: spacing.xl,
    marginHorizontal: spacing.lg,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.sm,
    borderRadius: 12,
    minHeight: 48,
    gap: spacing.md,
  },
  navRowActive: {
    backgroundColor: 'rgba(168, 165, 230, 0.08)',
  },
  navRowLabelActive: {
    fontFamily: fonts.medium,
    flex: 1,
  },
  chevron: {
    marginLeft: 'auto',
  },
  pressed: {
    opacity: 0.6,
  },
  accountDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  accountEyebrow: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  accountInfo: {
    flex: 1,
  },
  accountCaption: {
    marginTop: 2,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.sm,
    marginTop: spacing.xs,
    borderRadius: 12,
    minHeight: 48,
    gap: spacing.md,
  },
  signOutSheetTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  signOutSheetBody: {
    marginBottom: spacing.xl,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  signOutSheetGap: {
    height: spacing.sm,
  },
});
