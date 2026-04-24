import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import { Text, Divider, SectionLabel } from '@/components';
import { useBabyStore } from '@/state/babyStore';
import { colors, radii, spacing } from '@/theme';
import { t } from '@/i18n';

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

  const goTo = (route: 'Home' | 'History' | 'Profile') => {
    props.navigation.navigate(route);
  };

  const currentRoute = props.state.routeNames[props.state.index];

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Text variant="wordmark" tone="primary">
          MIMI
        </Text>
      </View>

      <SectionLabel label={t('drawer.children')} />
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
                styles.row,
                isActive && styles.rowActive,
                pressed && styles.pressed,
              ]}
            >
              <Text
                variant="body"
                tone={isActive ? 'primary' : 'secondary'}
                style={isActive ? styles.rowLabelActive : undefined}
              >
                {baby.name}
              </Text>
              {isActive ? (
                <Text variant="body" tone="accent">
                  ●
                </Text>
              ) : null}
            </Pressable>
          );
        })
      )}

      <Pressable
        onPress={goAddChild}
        style={({ pressed }) => [
          styles.row,
          styles.addRow,
          pressed && styles.pressed,
        ]}
      >
        <Text variant="body" tone="accent">
          + {t('drawer.addChild')}
        </Text>
      </Pressable>

      <View style={styles.dividerWrap}>
        <Divider />
      </View>

      <Pressable
        onPress={() => goTo('Home')}
        style={({ pressed }) => [
          styles.row,
          currentRoute === 'Home' && styles.rowActive,
          pressed && styles.pressed,
        ]}
      >
        <Text variant="body" tone="primary">
          {t('nav.home')}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => goTo('History')}
        style={({ pressed }) => [
          styles.row,
          currentRoute === 'History' && styles.rowActive,
          pressed && styles.pressed,
        ]}
      >
        <Text variant="body" tone="primary">
          {t('nav.history')}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => goTo('Profile')}
        style={({ pressed }) => [
          styles.row,
          currentRoute === 'Profile' && styles.rowActive,
          pressed && styles.pressed,
        ]}
      >
        <Text variant="body" tone="primary">
          {t('nav.settings')}
        </Text>
      </Pressable>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  rowActive: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.md,
    marginHorizontal: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  rowLabelActive: {
    fontWeight: '500',
  },
  emptyRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  addRow: {
    marginTop: spacing.xs,
  },
  dividerWrap: {
    marginVertical: spacing.base,
    marginHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.6,
  },
});
