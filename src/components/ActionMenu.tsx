import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeOutDown,
} from 'react-native-reanimated';
import { Text } from './Text';
import { colors, fonts, radii, spacing } from '@/theme';

export interface ActionMenuItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface ActionMenuProps {
  visible: boolean;
  onClose: () => void;
  items: ActionMenuItem[];
}

const EXIT_TOTAL_MS = 160;
const CARD_HEIGHT = 116;

export const ActionMenu: React.FC<ActionMenuProps> = ({
  visible,
  onClose,
  items,
}) => {
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }
    if (mounted) {
      const id = setTimeout(() => setMounted(false), EXIT_TOTAL_MS);
      return () => clearTimeout(id);
    }
  }, [visible, mounted]);

  if (!mounted) return null;

  return (
    <View style={styles.root} pointerEvents="box-none">
      {visible ? (
        <Animated.View
          entering={FadeIn.duration(140)}
          exiting={FadeOut.duration(120)}
          style={StyleSheet.absoluteFill}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
            <MaskedView
              style={StyleSheet.absoluteFill}
              maskElement={
                <LinearGradient
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)']}
                  locations={[0, 1]}
                  style={StyleSheet.absoluteFill}
                />
              }
            >
              <BlurView
                intensity={Platform.OS === 'ios' ? 50 : 28}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: 'rgba(7, 11, 31, 0.55)' },
                ]}
              />
            </MaskedView>
          </Pressable>
        </Animated.View>
      ) : null}

      {visible ? (
        <SafeAreaView
          style={styles.bottom}
          edges={['bottom']}
          pointerEvents="box-none"
        >
          <View style={styles.grid} pointerEvents="box-none">
            {items.map((item, i) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(i * 25).duration(160)}
                exiting={FadeOutDown.duration(120)}
                style={styles.cell}
              >
                <Pressable
                  onPress={item.onPress}
                  style={({ pressed }) => [
                    styles.card,
                    pressed && styles.pressed,
                  ]}
                >
                  <BlurView
                    intensity={Platform.OS === 'ios' ? 24 : 14}
                    tint="dark"
                    style={[StyleSheet.absoluteFill, styles.cardBlur]}
                  />
                  <View style={styles.iconWell}>
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={colors.pure.white}
                    />
                  </View>
                  <Text variant="body" tone="primary" style={styles.label}>
                    {item.label}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </SafeAreaView>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    elevation: 50,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cell: {
    flex: 1,
  },
  card: {
    height: CARD_HEIGHT,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'hidden',
  },
  cardBlur: {
    borderRadius: radii.xl,
  },
  pressed: {
    opacity: 0.6,
  },
  iconWell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  label: {
    fontFamily: fonts.medium,
    textAlign: 'left',
  },
});
