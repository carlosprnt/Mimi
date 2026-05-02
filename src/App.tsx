import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { RootNavigator } from '@/navigation/RootNavigator';
import { useSessionBootstrap } from '@/hooks/useSessionBootstrap';
import { useWidgetReconcile } from '@/hooks/useWidgetReconcile';
import { colors } from '@/theme';
import { SubscriptionProvider, ProPaywallScreen } from '@/subscription';

const SessionBootstrap: React.FC = () => {
  useSessionBootstrap();
  return null;
};

const WidgetReconcile: React.FC = () => {
  useWidgetReconcile();
  return null;
};

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <SubscriptionProvider>
          <View style={styles.root}>
            <StatusBar style="light" />
            <SessionBootstrap />
            <WidgetReconcile />
            {fontsLoaded ? <RootNavigator /> : <View style={styles.root} />}
            <ProPaywallScreen />
          </View>
        </SubscriptionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
});
