import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components';
import { useBabyStore, useActiveBaby } from '@/state/babyStore';
import { useMenuStore } from '@/state/menuStore';
import { colors, fonts, spacing } from '@/theme';
import { t } from '@/i18n';

interface MenuPanelProps {
  /** Effective open progress (0 → 1). Drives the cascade animation. */
  progress: SharedValue<number>;
}

interface MenuItem {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

const ITEM_LEFT = 24;
const ITEM_GAP = 14;
const ICON_SIZE = 44;
// How long each item's reveal takes inside the global progress (out of 1).
const ITEM_DURATION = 0.55;
// Stagger between items inside the global progress.
const ITEM_STAGGER = 0.13;

export const MenuPanel: React.FC<MenuPanelProps> = ({ progress }) => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const setMenuOpen = useMenuStore((s) => s.setOpen);
  const activeBaby = useActiveBaby();

  const close = () => setMenuOpen(false);

  const goEditBaby = () => {
    if (!activeBaby) return;
    close();
    navigation.getParent()?.navigate('BabyEdit', { babyId: activeBaby.id });
  };

  const goAddBaby = () => {
    close();
    navigation.getParent()?.navigate('OnboardingName', { mode: 'addChild' });
  };

  const goHistory = () => {
    close();
    navigation.replace('History');
  };

  const goSettings = () => {
    close();
    navigation.replace('Profile');
  };

  const items: MenuItem[] = [
    {
      key: 'editBaby',
      icon: 'create-outline',
      label: activeBaby
        ? t('drawer.editBabyData', { name: activeBaby.name })
        : t('drawer.edit'),
      onPress: goEditBaby,
    },
    {
      key: 'addBaby',
      icon: 'add',
      label: t('drawer.addBaby'),
      onPress: goAddBaby,
    },
    {
      key: 'history',
      icon: 'pie-chart-outline',
      label: t('nav.history'),
      onPress: goHistory,
    },
    {
      key: 'settings',
      icon: 'settings-outline',
      label: t('drawer.appSettings'),
      onPress: goSettings,
    },
  ];

  return (
    <View
      style={[styles.container, { paddingTop: insets.top + spacing.huge }]}
      pointerEvents="box-none"
    >
      {items.map((item, idx) => (
        <CascadeItem key={item.key} index={idx} progress={progress} item={item} />
      ))}
    </View>
  );
};

const CascadeItem: React.FC<{
  index: number;
  progress: SharedValue<number>;
  item: MenuItem;
}> = ({ index, progress, item }) => {
  const start = index * ITEM_STAGGER;
  const end = Math.min(1, start + ITEM_DURATION);

  const animStyle = useAnimatedStyle(() => {
    const local = interpolate(
      progress.value,
      [start, end],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity: local,
      transform: [
        { translateX: interpolate(local, [0, 1], [-60, 0]) },
      ],
    };
  });

  return (
    <Animated.View style={[styles.row, animStyle]}>
      <Pressable
        onPress={item.onPress}
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressed,
        ]}
        hitSlop={6}
      >
        <View style={styles.iconCircle}>
          <Ionicons name={item.icon} size={20} color="#0E0F12" />
        </View>
        <Text variant="body" tone="primary" style={styles.label} numberOfLines={1}>
          {item.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: ITEM_LEFT,
    paddingRight: spacing.lg,
    gap: ITEM_GAP,
  },
  row: {
    alignSelf: 'flex-start',
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  iconCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: colors.pure.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 18,
    flexShrink: 1,
  },
  pressed: { opacity: 0.6 },
});
