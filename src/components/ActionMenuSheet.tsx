import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeOutDown,
} from 'react-native-reanimated';
import { Sheet } from './Sheet';
import { Text } from './Text';
import { colors, fonts, radii, spacing } from '@/theme';

export interface ActionMenuItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface ActionMenuSheetProps {
  visible: boolean;
  onClose: () => void;
  items: ActionMenuItem[];
  title?: string;
}

export const ActionMenuSheet: React.FC<ActionMenuSheetProps> = ({
  visible,
  onClose,
  items,
  title,
}) => {
  return (
    <Sheet visible={visible} onClose={onClose}>
      {title ? (
        <Text variant="eyebrow" tone="tertiary" style={styles.title}>
          {title}
        </Text>
      ) : null}
      <View style={styles.list}>
        {items.map((item, i) => (
          <Animated.View
            key={item.id}
            entering={FadeInDown.delay(i * 50).duration(260).springify()}
            exiting={FadeOutDown.duration(140)}
          >
            <Pressable
              onPress={() => {
                item.onPress();
              }}
              style={({ pressed }) => [
                styles.row,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.iconWell}>
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={colors.accent.base}
                />
              </View>
              <Text variant="body" tone="primary" style={styles.label}>
                {item.label}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.text.tertiary}
              />
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  list: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  pressed: {
    opacity: 0.6,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(168, 165, 230, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168, 165, 230, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontFamily: fonts.medium,
  },
});
