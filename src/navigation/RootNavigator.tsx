import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { useBabyStore } from '@/state/babyStore';
import { HomeScreen } from '@/screens/HomeScreen';
import { HistoryScreen } from '@/screens/HistoryScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { BabyEditScreen } from '@/screens/BabyEditScreen';
import { WelcomeScreen } from '@/screens/onboarding/WelcomeScreen';
import { OnboardingDobScreen } from '@/screens/onboarding/OnboardingDobScreen';
import { OnboardingAtTermScreen } from '@/screens/onboarding/OnboardingAtTermScreen';
import { OnboardingDueDateScreen } from '@/screens/onboarding/OnboardingDueDateScreen';
import { OnboardingIdentityScreen } from '@/screens/onboarding/OnboardingIdentityScreen';
import { OnboardingSexScreen } from '@/screens/onboarding/OnboardingSexScreen';
import { OnboardingSummaryScreen } from '@/screens/onboarding/OnboardingSummaryScreen';
import { NameScreen } from '@/screens/onboarding/NameScreen';
import { DobScreen } from '@/screens/onboarding/DobScreen';
import { PrematurityScreen } from '@/screens/onboarding/PrematurityScreen';
import { colors } from '@/theme';
import { DrawerSceneWrapper } from './DrawerSceneWrapper';
import { MainStackParamList, RootStackParamList } from './types';

const DEEP_NIGHT_BG = '#000000';

const Stack = createNativeStackNavigator<RootStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

const wrapMainScene = (
  Inner: React.ComponentType<Record<string, unknown>>,
): React.ComponentType<Record<string, unknown>> => {
  const Scene: React.FC<Record<string, unknown>> = (props) => (
    <DrawerSceneWrapper>
      <Inner {...props} />
    </DrawerSceneWrapper>
  );
  return Scene;
};

const HomeScene = wrapMainScene(HomeScreen as React.ComponentType<Record<string, unknown>>);
const HistoryScene = wrapMainScene(HistoryScreen as React.ComponentType<Record<string, unknown>>);
const ProfileScene = wrapMainScene(ProfileScreen as React.ComponentType<Record<string, unknown>>);

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: DEEP_NIGHT_BG,
    card: colors.bg.base,
    text: colors.text.primary,
    border: colors.border.hairline,
    primary: colors.accent.base,
    notification: colors.accent.base,
  },
};

const RootMainStack: React.FC = () => {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'slide_from_right',
      }}
    >
      <MainStack.Screen name="Home" component={HomeScene} />
      <MainStack.Screen name="History" component={HistoryScene} />
      <MainStack.Screen name="Profile" component={ProfileScene} />
    </MainStack.Navigator>
  );
};

export const RootNavigator: React.FC = () => {
  const babies = useBabyStore((s) => s.babies);
  const hydrated = useBabyStore((s) => s.hydrated);

  if (!hydrated) return null;

  const hasBaby = babies.length > 0;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg.base },
          animation: 'slide_from_right',
        }}
        initialRouteName={hasBaby ? 'Root' : 'OnboardingWelcome'}
      >
        <Stack.Screen name="OnboardingWelcome" component={WelcomeScreen} />
        <Stack.Screen
          name="OnboardingDob"
          component={OnboardingDobScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="OnboardingAtTerm" component={OnboardingAtTermScreen} />
        <Stack.Screen
          name="OnboardingDueDate"
          component={OnboardingDueDateScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="OnboardingIdentity" component={OnboardingIdentityScreen} />
        <Stack.Screen name="OnboardingSex" component={OnboardingSexScreen} />
        <Stack.Screen
          name="OnboardingSummary"
          component={OnboardingSummaryScreen}
          options={{ animation: 'fade', animationDuration: 380 }}
        />
        <Stack.Screen name="OnboardingName" component={NameScreen} />
        <Stack.Screen name="OnboardingDobLegacy" component={DobScreen} />
        <Stack.Screen name="OnboardingPrematurity" component={PrematurityScreen} />
        <Stack.Screen name="Root" component={RootMainStack} />
        <Stack.Screen name="BabyEdit" component={BabyEditScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
