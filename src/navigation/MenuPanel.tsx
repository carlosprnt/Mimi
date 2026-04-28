import React, { useState } from 'react';
import { Pressable, StyleSheet, View, LayoutChangeEvent } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components';
import { useBabyStore } from '@/state/babyStore';
import { colors, fonts, spacing } from '@/theme';
import { t } from '@/i18n';

type RouteName = 'Home' | 'History' | 'Profile';

interface MenuPanelProps {
  activeRoute: RouteName;
  onContentHeight?: (height: number) => void;
}

const BOX_RADIUS = 22;
const TILE_BG = 'rgba(19, 27, 58, 0.78)';
const TILE_BORDER = 'rgba(120, 145, 220, 0.18)';
const TILE_BORDER_ACTIVE = 'rgba(168, 165, 230, 0.55)';
const TILE_BG_ACTIVE = 'rgba(40, 40, 100, 0.55)';

export const MenuPanel: React.FC<MenuPanelProps> = ({
  activeRoute,
  onContentHeight,
}) => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const setActiveBabyId = useBabyStore((s) => s.setActiveBabyId);

  const closeDrawer = () => navigation.dispatch(DrawerActions.closeDrawer());

  const selectBaby = (id: string) => {
    setActiveBabyId(id);
    closeDrawer();
  };

  const editBaby = (id: string) => {
    // eslint-disable-next-line no-console
    console.log('[MenuPanel] editBaby', id);
    navigation.getParent()?.navigate('BabyEdit', { babyId: id });
    closeDrawer();
  };

  const goAddBaby = () => {
    // eslint-disable-next-line no-console
    console.log('[MenuPanel] goAddBaby');
    navigation.getParent()?.navigate('OnboardingName', { mode: 'addChild' });
    closeDrawer();
  };

  const goTo = (route: RouteName) => {
    // eslint-disable-next-line no-console
    console.log('[MenuPanel] goTo', route, 'parent?', !!navigation.getParent());
    navigation.navigate(route);
    closeDrawer();
  };

  const tiles: Array<{ kind: 'baby'; id: string } | { kind: 'add' }> = [
    ...babies.map((b) => ({ kind: 'baby' as const, id: b.id })),
    { kind: 'add' as const },
  ];
  const rows: Array<Array<typeof tiles[number]>> = [];
  for (let i = 0; i < tiles.length; i += 2) {
    rows.push(tiles.slice(i, i + 2));
  }

  const handleLayout = (e: LayoutChangeEvent) => {
    onContentHeight?.(e.nativeEvent.layout.height);
  };

  return (
    <View style={styles.outer} onLayout={handleLayout}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#020205', '#040611', colors.night.bottom]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

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
      </View>
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
      <Text
        tone="primary"
        style={styles.babyName}
        numberOfLines={1}
      >
        {baby.name}
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
    <Text tone="accent" style={styles.tileName}>
      {t('drawer.addChild')}
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
    <View style={styles.navTileTopRow}>
      <Ionicons
        name={icon}
        size={22}
        color={isActive ? colors.accent.base : colors.text.secondary}
      />
    </View>
    <Text
      tone={isActive ? 'primary' : 'secondary'}
      style={styles.tileName}
    >
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  col: { flex: 1 },
  tile: {
    backgroundColor: TILE_BG,
    borderRadius: BOX_RADIUS,
    borderWidth: 1,
    borderColor: TILE_BORDER,
    padding: spacing.md,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  navTile: {
    minHeight: 88,
  },
  navTileTopRow: {
    marginBottom: spacing.sm,
  },
  tileActive: {
    borderColor: TILE_BORDER_ACTIVE,
    backgroundColor: TILE_BG_ACTIVE,
  },
  tileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
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
  },
  babyName: {
    fontFamily: fonts.medium,
    fontSize: 20,
    lineHeight: 24,
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
  pressed: { opacity: 0.6 },
});
