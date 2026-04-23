import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { Text } from './Text';

interface IconAction {
  glyph: string;
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
        {leading ? (
          <Pressable
            onPress={leading.onPress}
            accessibilityRole="button"
            accessibilityLabel={leading.label}
            hitSlop={10}
            style={({ pressed }) => [styles.glyphBtn, pressed && styles.pressed]}
          >
            <Text variant="headline" tone="secondary">
              {leading.glyph}
            </Text>
          </Pressable>
        ) : null}
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
          <Pressable
            key={action.label}
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            hitSlop={10}
            style={({ pressed }) => [styles.glyphBtn, pressed && styles.pressed]}
          >
            <Text variant="headline" tone="secondary">
              {action.glyph}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    height: 56,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    width: 88,
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
  glyphBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.elevated,
  },
  pressed: {
    opacity: 0.6,
  },
});
