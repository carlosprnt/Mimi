import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { Baby, ageLabel } from '@/logic/age';
import { colors, fonts, spacing } from '@/theme';

interface Props {
  visible: boolean;
  babies: Baby[];
  activeBabyId: string | null;
  /** Y of the (visible) header name, measured from the top of the
   *  screen. The dropdown anchors the active name there so it lines
   *  up with the header's own name. */
  nameTopY: number;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const NAME_FONT_SIZE = 34;
const NAME_LINE_HEIGHT = 38;
const AGE_FONT_SIZE = 14;
const AGE_LINE_HEIGHT = 18;
const ITEM_GAP = spacing.sm + 8;
const ANIM_OPEN = 320;
const ANIM_CLOSE = 220;
const ITEM_STAGGER = 60;

const BLUR_INTENSITY = 32;
const TINT_COLOR = 'rgba(11, 20, 54, 0.55)';

export const BabyDropdown: React.FC<Props> = ({
  visible,
  babies,
  activeBabyId,
  nameTopY,
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

  const active = babies.find((b) => b.id === activeBabyId) ?? null;
  const others = babies.filter((b) => b.id !== activeBabyId);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.root, overlayStyle]}
    >
      {/* Blur + tint masked top→bottom: opaque at top, fading to 0 at
          the bottom so the lower part of the dashboard shows through. */}
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <LinearGradient
            colors={['rgba(0,0,0,1)', 'rgba(0,0,0,1)', 'rgba(0,0,0,0)']}
            locations={[0, 0.35, 0.65]}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        <BlurView
          intensity={BLUR_INTENSITY}
          tint="dark"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, styles.tint]} />
      </MaskedView>

      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <View
        pointerEvents="box-none"
        style={[
          styles.list,
          {
            paddingTop: nameTopY,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
      >
        {active ? (
          <CascadeRow index={0} progress={progress}>
            <View style={styles.block}>
              <View style={styles.activeNameRow}>
                <BlinkingDot />
                <Text tone="primary" style={styles.name} numberOfLines={1}>
                  {active.name}
                </Text>
              </View>
              <Text tone="tertiary" style={styles.age} numberOfLines={1}>
                {ageLabel(active)}
              </Text>
            </View>
          </CascadeRow>
        ) : null}
        {others.map((baby, i) => (
          <CascadeRow key={baby.id} index={1 + i} progress={progress}>
            <Pressable
              onPress={() => onSelect(baby.id)}
              hitSlop={6}
              style={({ pressed }) => [
                styles.block,
                pressed && styles.pressed,
              ]}
            >
              <Text tone="primary" style={styles.name} numberOfLines={1}>
                {baby.name}
              </Text>
              <Text tone="tertiary" style={styles.age} numberOfLines={1}>
                {ageLabel(baby)}
              </Text>
            </Pressable>
          </CascadeRow>
        ))}
      </View>
    </Animated.View>
  );
};

const BlinkingDot: React.FC = () => {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [t]);
  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 1], [0.45, 1]),
  }));
  return <Animated.View style={[styles.activeDot, animStyle]} />;
};

const CascadeRow: React.FC<{
  index: number;
  progress: SharedValue<number>;
  children: React.ReactNode;
}> = ({ index, progress, children }) => {
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

  return <Animated.View style={animStyle}>{children}</Animated.View>;
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  tint: {
    backgroundColor: TINT_COLOR,
  },
  list: {
    paddingHorizontal: spacing.lg,
    gap: ITEM_GAP,
    alignItems: 'flex-end',
  },
  block: {
    alignItems: 'flex-end',
    paddingVertical: spacing.xs,
  },
  activeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent.base,
  },
  name: {
    fontFamily: fonts.medium,
    fontSize: NAME_FONT_SIZE,
    lineHeight: NAME_LINE_HEIGHT,
    color: colors.text.primary,
    textAlign: 'right',
  },
  age: {
    fontFamily: fonts.regular,
    fontSize: AGE_FONT_SIZE,
    lineHeight: AGE_LINE_HEIGHT,
    textAlign: 'right',
    marginTop: 2,
  },
  pressed: {
    opacity: 0.6,
  },
});
