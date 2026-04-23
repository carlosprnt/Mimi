import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/theme';
import { Eyebrow } from './Eyebrow';

interface SectionLabelProps {
  label: string;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({ label }) => (
  <View style={styles.wrap}>
    <Eyebrow>{label}</Eyebrow>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.xs,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
});
