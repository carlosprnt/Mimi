import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/theme';
import { Text } from './Text';
import { MoonIllustration } from './MoonIllustration';
import { t } from '@/i18n';

export const EmptyDay: React.FC = () => {
  return (
    <View style={styles.wrap}>
      <MoonIllustration size={160} />
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
  title: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
});
