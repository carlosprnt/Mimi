import React from 'react';
import { StyleSheet, View, ViewStyle, StatusBar, Platform } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '@/theme';
import { StarField } from './StarField';
import { CloudField } from './CloudField';

type Backdrop = 'flat' | 'night';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: readonly Edge[];
  background?: 'base' | 'sunken' | 'elevated';
  backdrop?: Backdrop;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  style,
  edges = ['top', 'left', 'right'],
  background = 'base',
  backdrop = 'flat',
}) => {
  const flatBg = colors.bg[background];
  const rootBg = backdrop === 'night' ? colors.night.bottom : flatBg;

  return (
    <View style={[styles.root, { backgroundColor: rootBg }]}>
      {Platform.OS === 'android' && (
        <StatusBar barStyle="light-content" backgroundColor={rootBg} />
      )}
      {backdrop === 'night' ? (
        <>
          <LinearGradient
            colors={gradients.nightSky.colors}
            locations={gradients.nightSky.locations}
            start={gradients.nightSky.start}
            end={gradients.nightSky.end}
            style={StyleSheet.absoluteFill}
          />
          <StarField />
          <CloudField />
        </>
      ) : null}
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
