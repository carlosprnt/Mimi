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
import { useSleepStore } from '@/state/sleepStore';
import { useCareEventStore } from '@/state/careEventStore';
import { useOnboardingDraft } from '@/state/onboardingDraft';
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
  const resetBabies = useBabyStore((s) => s.reset);
  const resetSleep = useSleepStore((s) => s.resetAll);
  const resetCareEvents = useCareEventStore((s) => s.resetAll);
  const clearOnboardingDraft = useOnboardingDraft((s) => s.clear);

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
    setSignOutOpen(false);
    resetSleep();
    resetCareEvents();
    clearOnboardingDraft();
    resetBabies();
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
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top, spacing.xl) },
          ]}
        >
        <View style={styles.header}>
          <Text variant="wordmark" tone="primary" style={styles.logo}>
            MIMI
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
          <View style={styles.addIcon}>
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
              <View
                style={[styles.navIconWrap, isActive && styles.navIconWrapActive]}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={isActive ? colors.accent.base : colors.text.secondary}
                />
              </View>
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

        <View style={styles.accountDivider} />

        <Text variant="eyebrow" tone="tertiary" style={styles.accountEyebrow}>
          {t('drawer.account')}
        </Text>

        <View style={styles.accountRow}>
          <View style={styles.accountAvatar}>
            <Ionicons
              name="person-outline"
              size={18}
              color={colors.text.secondary}
            />
          </View>
          <View style={styles.accountInfo}>
            <Text variant="body" tone="secondary" numberOfLines={1}>
              {t('drawer.accountLocal')}
            </Text>
            <Text
              variant="footnote"
              tone="tertiary"
              numberOfLines={1}
              style={styles.accountCaption}
            >
              {t('drawer.accountLocalCaption')}
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
          <View style={styles.signOutIconWrap}>
            <Ionicons
              name="log-out-outline"
              size={18}
              color={colors.danger.base}
            />
          </View>
          <Text variant="body" tone="danger">
            {t('drawer.signOut')}
          </Text>
        </Pressable>
      </DrawerContentScrollView>
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
          variant="ghost"
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
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  logo: {
    fontSize: 20,
    letterSpacing: 4,
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
  addIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(168, 165, 230, 0.45)',
    backgroundColor: 'rgba(168, 165, 230, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    fontFamily: fonts.medium,
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
  navIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapActive: {
    backgroundColor: 'rgba(168, 165, 230, 0.12)',
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
  accountAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
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
  signOutIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(226, 107, 98, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
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
