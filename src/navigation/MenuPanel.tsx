import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { CommonActions, DrawerActions } from '@react-navigation/native';
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

type RouteName = 'Home' | 'History' | 'Profile';

interface MenuPanelProps {
  activeRoute: RouteName;
  navigation: any;
}

const BOX_RADIUS = 22;

export const MenuPanel: React.FC<MenuPanelProps> = ({
  activeRoute,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const setActiveBabyId = useBabyStore((s) => s.setActiveBabyId);
  const clearOnboardingDraft = useOnboardingDraft((s) => s.clear);
  const signOutAuth = useAuthStore((s) => s.signOut);
  const authedUser = useAuthStore((s) => s.user);

  const [signOutOpen, setSignOutOpen] = useState(false);

  const closeDrawer = () => navigation.dispatch(DrawerActions.closeDrawer());

  const selectBaby = (id: string) => {
    setActiveBabyId(id);
    closeDrawer();
  };

  const editBaby = (id: string) => {
    closeDrawer();
    navigation.getParent()?.navigate('BabyEdit', { babyId: id });
  };

  const goAddBaby = () => {
    closeDrawer();
    navigation.getParent()?.navigate('OnboardingName', { mode: 'addChild' });
  };

  const goTo = (route: RouteName) => {
    navigation.navigate(route);
    closeDrawer();
  };

  const handleSignOut = () => {
    setSignOutOpen(false);
    void supabaseSignOut();
    clearOnboardingDraft();
    signOutAuth();
    closeDrawer();
    const parent = navigation.getParent();
    parent?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'OnboardingWelcome' }],
      }),
    );
  };

  // Pair babies into rows of two; the slot after the last baby is the
  // "add baby" tile so the grid always reads naturally.
  const tiles: Array<{ kind: 'baby'; id: string } | { kind: 'add' }> = [
    ...babies.map((b) => ({ kind: 'baby' as const, id: b.id })),
    { kind: 'add' as const },
  ];
  const rows: Array<Array<typeof tiles[number]>> = [];
  for (let i = 0; i < tiles.length; i += 2) {
    rows.push(tiles.slice(i, i + 2));
  }

  return (
    <View style={styles.outer} pointerEvents="box-none">
      <LinearGradient
        colors={['#020205', '#040611', colors.night.bottom]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + spacing.md },
        ]}
      >
        {rows.map((row, rIdx) => (
          <View key={`row-${rIdx}`} style={styles.row}>
            {row.map((tile, cIdx) => {
              const key = tile.kind === 'baby' ? `b-${tile.id}` : `add-${cIdx}`;
              return (
                <View key={key} style={styles.col}>
                  {tile.kind === 'baby' ? (
                    <BabyTile
                      babyId={tile.id}
                      isActive={tile.id === activeBabyId}
                      onSelect={() => selectBaby(tile.id)}
                      onEdit={() => editBaby(tile.id)}
                    />
                  ) : (
                    <AddTile onPress={goAddBaby} />
                  )}
                </View>
              );
            })}
            {row.length === 1 ? <View style={styles.col} /> : null}
          </View>
        ))}

        <View style={styles.row}>
          <View style={styles.col}>
            <NavTile
              icon="pie-chart-outline"
              label={t('nav.history')}
              isActive={activeRoute === 'History'}
              onPress={() => goTo('History')}
            />
          </View>
          <View style={styles.col}>
            <NavTile
              icon="settings-outline"
              label={t('nav.settings')}
              isActive={activeRoute === 'Profile'}
              onPress={() => goTo('Profile')}
            />
          </View>
        </View>

        <View style={styles.flex} />

        <View style={[styles.accountWrap, { marginBottom: insets.bottom + spacing.xs }]}>
          <View style={styles.accountBox}>
            <View style={styles.accountTop}>
              {authedUser?.picture ? (
                <Image source={{ uri: authedUser.picture }} style={styles.accountAvatar} />
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
              <View style={styles.accountInfo}>
                <Text variant="footnote" tone="tertiary" style={styles.accountEyebrow}>
                  {t('drawer.account')}
                </Text>
                <Text variant="body" tone="primary" numberOfLines={1}>
                  {authedUser?.email ?? t('drawer.accountLocal')}
                </Text>
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
        </View>
      </View>

      <Sheet visible={signOutOpen} onClose={() => setSignOutOpen(false)}>
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

const BabyTile: React.FC<{
  babyId: string;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
}> = ({ babyId, isActive, onSelect, onEdit }) => {
  const baby = useBabyStore((s) => s.babies.find((b) => b.id === babyId));
  if (!baby) return null;
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.tile,
        isActive && styles.tileActive,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.tileTopRow}>
        <View style={styles.tileAvatar}>
          <Text variant="body" tone="secondary" style={styles.tileAvatarLetter}>
            {baby.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Pressable hitSlop={8} onPress={onEdit}>
          <Text variant="footnote" tone="accent" style={styles.tileEdit}>
            {t('drawer.edit')}
          </Text>
        </Pressable>
      </View>
      <Text variant="body" tone="primary" style={styles.tileName} numberOfLines={1}>
        {baby.name}
      </Text>
      <Text variant="footnote" tone="tertiary" numberOfLines={1}>
        {ageLabel(baby)}
      </Text>
    </Pressable>
  );
};

const AddTile: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.tile,
      styles.addTile,
      pressed && styles.pressed,
    ]}
  >
    <View style={styles.tileTopRow}>
      <View style={styles.addAvatar}>
        <Ionicons name="add" size={20} color={colors.accent.base} />
      </View>
    </View>
    <Text variant="body" tone="accent" style={styles.tileName}>
      {t('drawer.addChild')}
    </Text>
    <Text variant="footnote" tone="tertiary" numberOfLines={1}>
      {t('drawer.addChildHint')}
    </Text>
  </Pressable>
);

const NavTile: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  isActive: boolean;
  onPress: () => void;
}> = ({ icon, label, isActive, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.tile,
      styles.navTile,
      isActive && styles.tileActive,
      pressed && styles.pressed,
    ]}
  >
    <Ionicons
      name={icon}
      size={22}
      color={isActive ? colors.accent.base : colors.text.secondary}
    />
    <Text
      variant="body"
      tone={isActive ? 'primary' : 'secondary'}
      style={styles.navTileLabel}
    >
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  outer: { ...StyleSheet.absoluteFillObject },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  col: { flex: 1 },
  tile: {
    backgroundColor: 'rgba(19, 27, 58, 0.78)',
    borderRadius: BOX_RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(120, 145, 220, 0.18)',
    padding: spacing.md,
    minHeight: 110,
    justifyContent: 'flex-start',
  },
  tileActive: {
    borderColor: 'rgba(168, 165, 230, 0.55)',
    backgroundColor: 'rgba(40, 40, 100, 0.55)',
  },
  tileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  tileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tileAvatarLetter: { fontFamily: fonts.semibold },
  tileEdit: { fontFamily: fonts.medium },
  tileName: {
    fontFamily: fonts.medium,
    marginBottom: 2,
  },
  addTile: {
    borderStyle: 'dashed',
    borderColor: 'rgba(168, 165, 230, 0.45)',
    backgroundColor: 'rgba(168, 165, 230, 0.06)',
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
  navTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.md,
    minHeight: 64,
  },
  navTileLabel: { fontFamily: fonts.medium },
  pressed: { opacity: 0.6 },
  accountWrap: {},
  accountBox: {
    backgroundColor: 'rgba(19, 27, 58, 0.78)',
    borderRadius: BOX_RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(120, 145, 220, 0.18)',
    padding: spacing.md,
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
  accountEyebrow: {
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
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
  signOutSheetGap: { height: spacing.sm },
});
