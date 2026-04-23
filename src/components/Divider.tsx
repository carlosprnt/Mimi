import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '@/theme';

interface DividerProps {
  inset?: number;
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({ inset = 0, style }) => (
  <View style={[styles.line, { marginLeft: inset }, style]} />
);

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.hairline,
  },
});
