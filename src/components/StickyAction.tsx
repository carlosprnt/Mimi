import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/theme';
import { Button } from './Button';

interface StickyActionProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'subtle';
}

export const StickyAction: React.FC<StickyActionProps> = ({
  title,
  onPress,
  variant = 'primary',
}) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { paddingBottom: Math.max(insets.bottom, spacing.base) },
      ]}
    >
      <Button title={title} onPress={onPress} variant={variant} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 0,
  },
});
