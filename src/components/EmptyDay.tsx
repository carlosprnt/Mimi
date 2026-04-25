import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/theme';
import { Text } from './Text';
import { t } from '@/i18n';

export const EmptyDay: React.FC = () => {
  return (
    <View style={styles.wrap}>
      <View style={styles.illustration}>
        <View style={styles.glow} />
        <View style={styles.moonOuter}>
          <View style={styles.moonInner}>
            <Ionicons
              name="moon"
              size={44}
              color={colors.accent.base}
            />
          </View>
        </View>
      </View>
      <Text variant="title" tone="primary" align="center" style={styles.title}>
        {t('emptyDay.title')}
      </Text>
      <Text variant="callout" tone="secondary" align="center">
        {t('emptyDay.body')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  illustration: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  glow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(168, 165, 230, 0.10)',
  },
  moonOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(168, 165, 230, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(168, 165, 230, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(168, 165, 230, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: spacing.sm,
  },
});
