import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
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

const EXIT_TOTAL_MS = 140;

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

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={StyleSheet.absoluteFill}>
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
            <View style={styles.list} pointerEvents="box-none">
              {items.map((item, i) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.delay(i * 25).duration(160)}
                  exiting={FadeOutDown.duration(120)}
                >
                  <Pressable
                    onPress={item.onPress}
                    style={({ pressed }) => [
                      styles.row,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.iconWell}>
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={colors.night.bottom}
                      />
                    </View>
                    <Text variant="body" style={styles.label}>
                      {item.label}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="rgba(14, 15, 18, 0.45)"
                    />
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </SafeAreaView>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: colors.pure.white,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 6 },
    }),
  },
  pressed: {
    opacity: 0.7,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(14, 15, 18, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    color: colors.night.bottom,
    fontFamily: fonts.medium,
  },
});
