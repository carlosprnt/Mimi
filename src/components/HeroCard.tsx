import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
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
    <View style={styles.wrap}>
      <View style={styles.glow} />
      <Card variant="bordered" tone="night">
        <Eyebrow tone={muted ? 'tertiary' : 'secondary'}>{eyebrow}</Eyebrow>
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
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    marginTop: spacing.base,
  },
  glow: {
    position: 'absolute',
    top: -40,
    left: 20,
    right: 20,
    height: 180,
    borderRadius: 180,
    backgroundColor: colors.accent.glow,
    opacity: 0.9,
    transform: [{ scaleX: 1.2 }],
  },
  primary: {
    marginTop: spacing.md,
  },
  supporting: {
    marginTop: spacing.sm,
  },
});
