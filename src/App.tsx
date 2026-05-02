import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from '@/navigation/RootNavigator';
import { colors } from '@/theme';
import { SubscriptionProvider, ProPaywallScreen } from '@/subscription';

export default function App() {

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <SubscriptionProvider>
          <View style={styles.root}>
            <StatusBar style="light" />
            <RootNavigator />
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
