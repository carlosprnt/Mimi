import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
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
import { Text, Sheet, Button, SignOutIcon } from '@/components';
import { useBabyStore } from '@/state/babyStore';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { useAuthStore } from '@/state/authStore';
import { signOut as supabaseSignOut } from '@/services/auth';
import { ageLabel } from '@/logic/age';
import { colors, fonts, spacing } from '@/theme';
import { t } from '@/i18n';
import {
  DRAWER_TOP,
  DRAWER_BOTTOM_MARGIN,
  DRAWER_LEFT_MARGIN,
} from './DrawerSceneWrapper';

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
  const [accountExpanded, setAccountExpanded] = useState(false);

  const selectBaby = (id: string) => {
    setActiveBabyId(id);
    props.navigation.closeDrawer();
  };

  const editBaby = (id: string) => {
    props.navigation.closeDrawer();
    props.navigation.getParent()?.navigate('BabyEdit', { babyId: id });
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
    { route: 'History', label: t('nav.history'), icon: 'pie-chart-outline' },
    { route: 'Profile', label: t('nav.settings'), icon: 'settings-outline' },
  ];

  return (
    <View style={styles.outer}>
      <View style={styles.panel}>
        <LinearGradient
          colors={['#020205', '#040611', colors.night.bottom]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
        <DrawerContentScrollView
          {...props}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
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
              const showDot = isActive && babies.length > 1;
              return (
                <View key={baby.id} style={styles.childChip}>
                  <Pressable
                    onPress={() => selectBaby(baby.id)}
                    style={({ pressed }) => [
                      styles.childMain,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.avatar}>
                      <Text
                        variant="body"
                        tone="secondary"
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
                    {showDot ? <View style={styles.activeDot} /> : null}
                  </Pressable>
                  <Pressable
                    onPress={() => editBaby(baby.id)}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.editBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text variant="footnote" tone="accent" style={styles.editLabel}>
                      {t('drawer.edit')}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        <Pressable
          onPress={goAddChild}
          style={({ pressed }) => [styles.addRow, pressed && styles.pressed]}
        >
          <View style={styles.addAvatar}>
            <Ionicons name="add" size={20} color={colors.accent.base} />
          </View>
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
          <Text variant="eyebrow" tone="tertiary" style={styles.accountEyebrow}>
            {t('drawer.account')}
          </Text>

          <Pressable
            onPress={() => setAccountExpanded((v) => !v)}
            style={({ pressed }) => [
              styles.accountRow,
              pressed && styles.pressed,
            ]}
            hitSlop={4}
          >
            <View style={styles.accountInfo}>
              <Text variant="body" tone="primary" numberOfLines={1}>
                {authedUser?.email ?? t('drawer.accountLocal')}
              </Text>
              {!authedUser ? (
                <Text
                  variant="footnote"
                  tone="tertiary"
                  numberOfLines={1}
                  style={styles.accountCaption}
                >
                  {t('drawer.accountLocalCaption')}
                </Text>
              ) : null}
            </View>
            {authedUser?.picture ? (
              <Image
                source={{ uri: authedUser.picture }}
                style={styles.accountAvatar}
              />
            ) : (
              <View style={styles.accountAvatar}>
                <Text
                  variant="body"
                  tone="onAccent"
                  style={styles.accountInitials}
                >
                  {(authedUser?.name ?? authedUser?.email ?? '·')
                    .trim()
                    .slice(0, 2)
                    .toUpperCase()}
                </Text>
              </View>
            )}
          </Pressable>

          {accountExpanded && authedUser ? (
            <Pressable
              onPress={() => setSignOutOpen(true)}
              style={({ pressed }) => [
                styles.signOutRow,
                pressed && styles.pressed,
              ]}
            >
              <SignOutIcon size={20} />
              <Text variant="body" tone="danger">
                {t('drawer.signOut')}
              </Text>
            </Pressable>
          ) : null}
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
    paddingTop: DRAWER_TOP,
    paddingBottom: DRAWER_BOTTOM_MARGIN,
    paddingLeft: DRAWER_LEFT_MARGIN,
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  accountFooter: {
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  wordmark: {
    fontSize: 20,
    letterSpacing: 0,
    fontFamily: fonts.medium,
  },
  childList: {
    paddingHorizontal: 0,
    gap: spacing.xs,
  },
  childChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  childMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
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
  editBtn: {
    paddingTop: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
  },
  editLabel: {
    fontFamily: fonts.medium,
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
    paddingHorizontal: 0,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    gap: spacing.md,
  },
  addAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 165, 230, 0.35)',
    backgroundColor: 'rgba(168, 165, 230, 0.08)',
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
    marginVertical: spacing.md,
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
  accountEyebrow: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
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
  accountAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent.base,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  accountInitials: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
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
