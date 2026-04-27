import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../Text';
import { colors, spacing } from '@/theme';
import { lightImpact } from '@/utils/haptics';

interface ChoiceCardProps {
  label: string;
  caption?: string;
  selected?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

export const ChoiceCard: React.FC<ChoiceCardProps> = ({
  label,
  caption,
  selected,
  icon,
  onPress,
}) => {
  const handlePress = () => {
    lightImpact();
    onPress();
  };
  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      {icon ? (
        <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
          <Ionicons
            name={icon}
            size={20}
            color={selected ? colors.accent.base : colors.text.secondary}
          />
        </View>
      ) : null}
      <View style={styles.body}>
        <Text variant="body" tone={selected ? 'primary' : 'secondary'}>
          {label}
        </Text>
        {caption ? (
          <Text variant="footnote" tone="tertiary" style={styles.caption}>
            {caption}
          </Text>
        ) : null}
      </View>
      {selected ? (
        <View style={styles.checkmark}>
          <Ionicons name="checkmark" size={16} color={colors.text.onAccent} />
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: spacing.md,
  },
  cardSelected: {
    backgroundColor: 'rgba(168, 165, 230, 0.10)',
    borderColor: 'rgba(168, 165, 230, 0.35)',
  },
  cardPressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconWrapSelected: {
    backgroundColor: 'rgba(168, 165, 230, 0.18)',
    borderColor: 'rgba(168, 165, 230, 0.35)',
  },
  body: {
    flex: 1,
  },
  caption: {
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
