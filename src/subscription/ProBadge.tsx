import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components';
import { colors, radii, spacing } from '@/theme';
import { t } from '@/i18n';

interface ProBadgeProps {
  tone?: 'soft' | 'solid';
}

export const ProBadge: React.FC<ProBadgeProps> = ({ tone = 'soft' }) => {
  const isSolid = tone === 'solid';
  return (
    <View style={[styles.badge, isSolid ? styles.solid : styles.soft]}>
      <Text
        variant="eyebrow"
        tone={isSolid ? 'onAccent' : 'accent'}
        style={styles.label}
      >
        {t('pro.badge')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  soft: {
    backgroundColor: colors.accent.soft,
  },
  solid: {
    backgroundColor: colors.accent.base,
  },
  label: {
    letterSpacing: 1,
  },
});
