import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Text } from '@/components';
import { colors, radii, spacing } from '@/theme';
import { t } from '@/i18n';
import { ProBadge } from './ProBadge';

interface LockedFeatureCardProps {
  title: string;
  caption?: string;
  onPress: () => void;
}

export const LockedFeatureCard: React.FC<LockedFeatureCardProps> = ({
  title,
  caption,
  onPress,
}) => {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${t('pro.locked')}. ${t('pro.unlockFeature')}`}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <Card variant="bordered" tone="night" padded={false} style={styles.card}>
        <View style={styles.inner}>
          <View style={styles.head}>
            <View style={styles.lockWrap}>
              <Ionicons
                name="lock-closed-outline"
                size={14}
                color={colors.accent.base}
              />
            </View>
            <ProBadge />
          </View>

          <Text variant="headline" tone="primary" style={styles.title}>
            {title}
          </Text>

          {caption ? (
            <Text variant="callout" tone="secondary" style={styles.caption}>
              {caption}
            </Text>
          ) : null}

          <Text variant="footnote" tone="tertiary" style={styles.locked}>
            {t('pro.locked')}
          </Text>

          <View style={styles.cta}>
            <Text variant="callout" tone="accent" style={styles.ctaLabel}>
              {t('pro.unlockFeature')} →
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  inner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  lockWrap: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.accent.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: spacing.xs,
  },
  caption: {
    marginBottom: spacing.sm,
  },
  locked: {
    marginTop: spacing.xs,
  },
  cta: {
    marginTop: spacing.md,
  },
  ctaLabel: {
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.85,
  },
});
