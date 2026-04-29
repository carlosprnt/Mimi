import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components';
import { useActiveBaby } from '@/state/babyStore';
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
  /** When true, the icon bubble uses a dotted ring instead of solid. */
  dotted?: boolean;
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
      dotted: true,
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
        <IconBubble icon={item.icon} index={index} dotted={item.dotted} />
        <Text variant="body" tone="primary" style={styles.label} numberOfLines={1}>
          {item.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const IconBubble: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  index: number;
  dotted?: boolean;
}> = ({ icon, index, dotted }) => {
  const glow = useSharedValue(0);

  useEffect(() => {
    // Each bubble's shimmer is offset slightly so they don't pulse in
    // perfect sync, giving a more organic feel.
    const offset = index * 220;
    const start = setTimeout(() => {
      glow.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
          }),
          withTiming(0, {
            duration: 1600,
            easing: Easing.inOut(Easing.quad),
          }),
        ),
        -1,
        false,
      );
    }, offset);
    return () => clearTimeout(start);
  }, [glow, index]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.35, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.bubble}>
      <BlurView
        intensity={32}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
        style={styles.bubbleBlur}
      />
      <View style={styles.bubbleTint} pointerEvents="none" />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bubbleGlow,
          dotted && styles.bubbleGlowDotted,
          glowStyle,
        ]}
      />
      <Ionicons name={icon} size={20} color={colors.pure.white} />
    </View>
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
  bubble: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  bubbleTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 35, 90, 0.55)',
  },
  bubbleGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ICON_SIZE / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.95)',
    // Soft shadow halo so the white ring picks up a glow against the
    // dark backdrop.
    shadowColor: 'rgba(255,255,255,0.8)',
    shadowOpacity: 0.7,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  bubbleGlowDotted: {
    borderStyle: 'dotted',
    borderWidth: 2,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 18,
    flexShrink: 1,
  },
  pressed: { opacity: 0.6 },
});
