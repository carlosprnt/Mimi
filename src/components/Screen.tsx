import React from 'react';
import { StyleSheet, View, ViewStyle, StatusBar, Platform } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors } from '@/theme';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: readonly Edge[];
  background?: 'base' | 'sunken' | 'elevated';
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  style,
  edges = ['top', 'left', 'right'],
  background = 'base',
}) => {
  const bg = colors.bg[background];
  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {Platform.OS === 'android' && (
        <StatusBar barStyle="light-content" backgroundColor={bg} />
      )}
      <SafeAreaView style={[styles.safe, style]} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
});
