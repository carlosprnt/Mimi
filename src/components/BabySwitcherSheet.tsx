import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Sheet } from './Sheet';
import { Text } from './Text';
import { Baby, ageLabel } from '@/logic/age';
import { colors, fonts, spacing } from '@/theme';
import { t } from '@/i18n';

interface BabySwitcherSheetProps {
  visible: boolean;
  babies: Baby[];
  activeBabyId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export const BabySwitcherSheet: React.FC<BabySwitcherSheetProps> = ({
  visible,
  babies,
  activeBabyId,
  onSelect,
  onClose,
}) => {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text variant="title" align="center" style={styles.title}>
        {t('drawer.selectBaby')}
      </Text>

      <View style={styles.list}>
        {babies.map((baby) => {
          const isActive = baby.id === activeBabyId;
          return (
            <Pressable
              key={baby.id}
              onPress={() => onSelect(baby.id)}
              style={({ pressed }) => [
                styles.row,
                isActive && styles.rowActive,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.avatar}>
                <Text variant="body" tone="secondary" style={styles.avatarLetter}>
                  {baby.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.info}>
                <Text
                  variant="body"
                  tone="primary"
                  numberOfLines={1}
                  style={isActive ? styles.nameActive : undefined}
                >
                  {baby.name}
                </Text>
                <Text variant="footnote" tone="tertiary" numberOfLines={1}>
                  {ageLabel(baby)}
                </Text>
              </View>
              {isActive ? (
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={colors.accent.base}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowActive: {
    backgroundColor: 'rgba(168, 165, 230, 0.10)',
    borderColor: 'rgba(168, 165, 230, 0.28)',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  avatarLetter: { fontFamily: fonts.semibold },
  info: { flex: 1 },
  nameActive: { fontFamily: fonts.medium },
  pressed: { opacity: 0.6 },
});
