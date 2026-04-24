import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components';
import { useBabyStore } from '@/state/babyStore';
import { colors, fonts, spacing } from '@/theme';
import { t } from '@/i18n';

type RouteName = 'Home' | 'History' | 'Profile';

interface NavItem {
  route: RouteName;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const DrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const setActiveBabyId = useBabyStore((s) => s.setActiveBabyId);

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

  const currentRoute = props.state.routeNames[props.state.index];

  const navItems: NavItem[] = [
    { route: 'Home', label: t('nav.home'), icon: 'home-outline' },
    { route: 'History', label: t('nav.history'), icon: 'time-outline' },
    { route: 'Profile', label: t('nav.settings'), icon: 'settings-outline' },
  ];

  return (
    <View style={styles.container}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text variant="wordmark" tone="primary" style={styles.logo}>
            MIMI
          </Text>
        </View>

        <Text variant="eyebrow" tone="tertiary" style={styles.sectionLabel}>
          {t('drawer.children')}
        </Text>
        {babies.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text variant="callout" tone="tertiary">
              {t('drawer.noChildren')}
            </Text>
          </View>
        ) : (
          babies.map((baby) => {
            const isActive = baby.id === activeBabyId;
            return (
              <Pressable
                key={baby.id}
                onPress={() => selectBaby(baby.id)}
                style={({ pressed }) => [
                  styles.childRow,
                  isActive && styles.childRowActive,
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
                <Text
                  variant="body"
                  tone={isActive ? 'primary' : 'secondary'}
                  style={isActive ? styles.childRowLabelActive : styles.childRowLabel}
                >
                  {baby.name}
                </Text>
              </Pressable>
            );
          })
        )}

        <Pressable
          onPress={goAddChild}
          style={({ pressed }) => [styles.addRow, pressed && styles.pressed]}
        >
          <View style={styles.addIcon}>
            <Ionicons name="add" size={18} color={colors.accent.base} />
          </View>
          <Text variant="body" tone="accent">
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
                style={styles.navIcon}
              />
              <Text
                variant="body"
                tone={isActive ? 'primary' : 'secondary'}
                style={isActive ? styles.navRowLabelActive : undefined}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </DrawerContentScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.night.bottom,
  },
  scrollContent: {
    paddingTop: spacing.huge,
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  logo: {
    fontSize: 24,
    letterSpacing: 4,
  },
  sectionLabel: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 48,
    gap: spacing.md,
  },
  childRowActive: {
    backgroundColor: 'rgba(168, 165, 230, 0.08)',
  },
  childRowLabel: {
    flex: 1,
  },
  childRowLabelActive: {
    flex: 1,
    fontFamily: fonts.medium,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontFamily: fonts.medium,
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
    marginTop: spacing.xs,
    gap: spacing.md,
  },
  addIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accent.base,
    backgroundColor: 'rgba(168, 165, 230, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
    gap: spacing.md,
  },
  navRowActive: {
    backgroundColor: 'rgba(168, 165, 230, 0.08)',
  },
  navIcon: {
    width: 24,
    textAlign: 'center',
  },
  navRowLabelActive: {
    fontFamily: fonts.medium,
  },
  pressed: {
    opacity: 0.6,
  },
});
