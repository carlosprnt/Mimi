import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, spacing } from '@/theme';
import { Text } from './Text';
import { Divider } from './Divider';

interface ListRowProps {
  label: string;
  value?: string;
  caption?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  showDivider?: boolean;
  style?: ViewStyle;
}

export const ListRow: React.FC<ListRowProps> = ({
  label,
  value,
  caption,
  onPress,
  trailing,
  showDivider = true,
  style,
}) => {
  const content = (
    <View style={[styles.row, style]}>
      <View style={styles.labelCol}>
        <Text variant="body" tone="secondary">
          {label}
        </Text>
        {caption ? (
          <Text variant="footnote" tone="tertiary" style={styles.caption}>
            {caption}
          </Text>
        ) : null}
      </View>
      <View style={styles.valueCol}>
        {value ? (
          <Text variant="body" tone="primary" tabular align="right">
            {value}
          </Text>
        ) : null}
        {trailing}
      </View>
    </View>
  );

  return (
    <View>
      {onPress ? (
        <Pressable
          onPress={onPress}
          android_ripple={{ color: colors.border.hairline }}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          {content}
        </Pressable>
      ) : (
        content
      )}
      {showDivider ? <Divider /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelCol: {
    flex: 1,
    paddingRight: spacing.md,
  },
  caption: {
    marginTop: 2,
  },
  valueCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.6,
  },
});
