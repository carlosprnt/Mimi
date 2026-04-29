import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { Baby } from '@/logic/age';
import { colors, fonts, spacing } from '@/theme';

interface Props {
  visible: boolean;
  babies: Baby[];
  activeBabyId: string | null;
  /** Pixels from the top of the screen to dock the dropdown below
   *  (typically the dashboard header height). */
  topOffset: number;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const ITEM_FONT_SIZE = 26;
const ITEM_GAP = spacing.sm;
const ANIM_OPEN = 320;
const ANIM_CLOSE = 220;
const ITEM_STAGGER = 60;

export const BabyDropdown: React.FC<Props> = ({
  visible,
  babies,
  activeBabyId,
  topOffset,
  onSelect,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, {
        duration: ANIM_OPEN,
        easing: Easing.out(Easing.cubic),
      });
    } else if (mounted) {
      progress.value = withTiming(0, {
        duration: ANIM_CLOSE,
        easing: Easing.in(Easing.cubic),
      });
      const id = setTimeout(() => setMounted(false), ANIM_CLOSE);
      return () => clearTimeout(id);
    }
  }, [visible, mounted, progress]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  if (!mounted) return null;

  const others = babies.filter((b) => b.id !== activeBabyId);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.root, { top: topOffset }, overlayStyle]}
    >
      <BlurView
        intensity={28}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.tint]} />

      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <View
        pointerEvents="box-none"
        style={[styles.list, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        {others.map((baby, i) => (
          <Item
            key={baby.id}
            baby={baby}
            index={i}
            progress={progress}
            onPress={() => onSelect(baby.id)}
          />
        ))}
      </View>
    </Animated.View>
  );
};

const Item: React.FC<{
  baby: Baby;
  index: number;
  progress: SharedValue<number>;
  onPress: () => void;
}> = ({ baby, index, progress, onPress }) => {
  const animStyle = useAnimatedStyle(() => {
    const start = (index * ITEM_STAGGER) / ANIM_OPEN;
    const local = interpolate(
      progress.value,
      [start, Math.min(1, start + 0.6)],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity: local,
      transform: [{ translateY: interpolate(local, [0, 1], [-12, 0]) }],
    };
  });

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        hitSlop={6}
        style={({ pressed }) => [styles.item, pressed && styles.pressed]}
      >
        <Text tone="primary" style={styles.itemText} numberOfLines={1}>
          {baby.name}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  tint: {
    backgroundColor: 'rgba(7, 11, 31, 0.30)',
  },
  list: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: ITEM_GAP,
    alignItems: 'flex-end',
  },
  item: {
    paddingVertical: spacing.xs,
  },
  itemText: {
    fontFamily: fonts.medium,
    fontSize: ITEM_FONT_SIZE,
    lineHeight: ITEM_FONT_SIZE + 4,
    textAlign: 'right',
    color: colors.text.primary,
  },
  pressed: {
    opacity: 0.6,
  },
});
