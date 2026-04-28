import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/theme';
import { Text } from './Text';

interface IconAction {
  glyph?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

interface HeaderBarProps {
  title?: string;
  subtitle?: string;
  leading?: IconAction;
  trailing?: IconAction[];
  showWordmark?: boolean;
}

const ActionButton: React.FC<{ action: IconAction }> = ({ action }) => (
  <Pressable
    onPress={action.onPress}
    accessibilityRole="button"
    accessibilityLabel={action.label}
    hitSlop={8}
    style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
  >
    {action.icon ? (
      <Ionicons name={action.icon} size={24} color={colors.accent.base} />
    ) : (
      <Text variant="headline" tone="accent">
        {action.glyph}
      </Text>
    )}
  </Pressable>
);

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  subtitle,
  leading,
  trailing,
  showWordmark,
}) => {
  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        {leading ? <ActionButton action={leading} /> : null}
      </View>

      <View style={styles.center}>
        {showWordmark ? (
          <Text variant="wordmark" tone="primary">
            MIMI
          </Text>
        ) : title ? (
          <Text variant="headline" tone="primary">
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text variant="footnote" tone="secondary" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={[styles.side, styles.sideRight]}>
        {(trailing ?? []).map((action) => (
          <ActionButton key={action.label} action={action} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    height: 64,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sideRight: {
    justifyContent: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  subtitle: {
    marginTop: 2,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
