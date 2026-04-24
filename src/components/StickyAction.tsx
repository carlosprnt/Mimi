import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '@/theme';
import { Button } from './Button';

interface StickyActionProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'subtle' | 'outline';
  onPressMore?: () => void;
  moreLabel?: string;
}

export const StickyAction: React.FC<StickyActionProps> = ({
  title,
  onPress,
  variant = 'primary',
  onPressMore,
  moreLabel,
}) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { paddingBottom: Math.max(insets.bottom, spacing.base) },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.primarySlot}>
          <Button title={title} onPress={onPress} variant={variant} />
        </View>
        {onPressMore ? (
          <Pressable
            onPress={onPressMore}
            accessibilityRole="button"
            accessibilityLabel={moreLabel}
            hitSlop={8}
            style={({ pressed }) => [
              styles.more,
              pressed && styles.morePressed,
            ]}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={22}
              color={colors.accent.base}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  primarySlot: {
    flex: 1,
  },
  more: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  morePressed: {
    opacity: 0.6,
  },
});
