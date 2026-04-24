import React from 'react';
import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';
import { Card } from './Card';
import { Text } from './Text';
import { Eyebrow } from './Eyebrow';

interface HeroCardProps {
  eyebrow: string;
  primary: string;
  supporting?: string;
  muted?: boolean;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  eyebrow,
  primary,
  supporting,
  muted,
}) => {
  return (
    <Card variant="bordered" tone="night" style={styles.wrap}>
      <Eyebrow tone="tertiary">{eyebrow}</Eyebrow>
      <Text
        variant="display"
        tone={muted ? 'primary' : 'accent'}
        tabular
        style={styles.primary}
      >
        {primary}
      </Text>
      {supporting ? (
        <Text variant="callout" tone="secondary" style={styles.supporting}>
          {supporting}
        </Text>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.base,
  },
  primary: {
    marginTop: spacing.md,
  },
  supporting: {
    marginTop: spacing.sm,
  },
});
