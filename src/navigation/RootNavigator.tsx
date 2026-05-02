import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { useBabyStore } from '@/state/babyStore';
import { HomeScreen } from '@/screens/HomeScreen';
import { HistoryScreen } from '@/screens/HistoryScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { StatsScreen } from '@/screens/StatsScreen';
import { WelcomeScreen } from '@/screens/onboarding/WelcomeScreen';
import { NameScreen } from '@/screens/onboarding/NameScreen';
import { DobScreen } from '@/screens/onboarding/DobScreen';
import { PrematurityScreen } from '@/screens/onboarding/PrematurityScreen';
import { colors } from '@/theme';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg.base,
    card: colors.bg.base,
    text: colors.text.primary,
    border: colors.border.hairline,
    primary: colors.accent.base,
    notification: colors.accent.base,
  },
};

export const RootNavigator: React.FC = () => {
  const babies = useBabyStore((s) => s.babies);
  const hydrated = useBabyStore((s) => s.hydrated);

  if (!hydrated) return null;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg.base },
          animation: 'slide_from_right',
        }}
        initialRouteName={babies.length > 0 ? 'Home' : 'OnboardingWelcome'}
      >
        <Stack.Screen name="OnboardingWelcome" component={WelcomeScreen} />
        <Stack.Screen name="OnboardingName" component={NameScreen} />
        <Stack.Screen name="OnboardingDob" component={DobScreen} />
        <Stack.Screen name="OnboardingPrematurity" component={PrematurityScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="Stats" component={StatsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
