import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  NavigationContainer,
  DarkTheme,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { useBabyStore } from '@/state/babyStore';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { HomeScreen } from '@/screens/HomeScreen';
import { HistoryScreen } from '@/screens/HistoryScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { BabyEditScreen } from '@/screens/BabyEditScreen';
import { LegalDocumentScreen } from '@/screens/LegalDocumentScreen';
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
      <MainStack.Screen
        name="Home"
        component={HomeScene}
        // Home is the root of the main stack — there's nothing to
        // navigate back to. Disabling the gesture here lets the
        // edge-swipe trigger the menu (handled in DrawerSceneWrapper)
        // without conflicting with the system back-swipe.
        options={{ gestureEnabled: false }}
      />
      <MainStack.Screen name="History" component={HistoryScene} />
      <MainStack.Screen name="Profile" component={ProfileScene} />
    </MainStack.Navigator>
  );
};

export const RootNavigator: React.FC = () => {
  const babies = useBabyStore((s) => s.babies);
  const hydrated = useBabyStore((s) => s.hydrated);
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const [routeName, setRouteName] = useState<string | undefined>(undefined);

  // The OnboardingHeader is rendered as a sibling of the Stack
  // (outside it) so that crossing screens does not slide it. We just
  // need to know which route is active, which we read from the
  // navigation ref via its state listener.
  useEffect(() => {
    const unsubscribe = navigationRef.addListener('state', () => {
      setRouteName(navigationRef.getCurrentRoute()?.name);
    });
    return unsubscribe;
  }, [navigationRef]);

  if (!hydrated) return <View style={{ flex: 1, backgroundColor: colors.bg.base }} />;

  const hasBaby = babies.length > 0;

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      onReady={() => setRouteName(navigationRef.getCurrentRoute()?.name)}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg.base },
          animation: 'slide_from_right',
        }}
        initialRouteName={hasBaby ? 'Root' : 'OnboardingWelcome'}
      >
        <Stack.Screen name="OnboardingWelcome" component={WelcomeScreen} />
        {/* Onboarding step screens use animation:'none' at the
             navigator level — the body content of each screen runs
             its own Reanimated keyframe (fade + scale + tiny shake)
             via OnboardingScene / per-screen Animated.View wrappers,
             so the visible transition is "elements blur out and the
             next step's elements fade in" rather than a stack slide. */}
        <Stack.Screen
          name="OnboardingDob"
          component={OnboardingDobScreen}
          options={{ animation: 'none' }}
        />
        <Stack.Screen
          name="OnboardingAtTerm"
          component={OnboardingAtTermScreen}
          options={{ animation: 'none' }}
        />
        <Stack.Screen
          name="OnboardingDueDate"
          component={OnboardingDueDateScreen}
          options={{ animation: 'none' }}
        />
        <Stack.Screen
          name="OnboardingIdentity"
          component={OnboardingIdentityScreen}
          options={{ animation: 'none' }}
        />
        <Stack.Screen
          name="OnboardingSex"
          component={OnboardingSexScreen}
          options={{ animation: 'none' }}
        />
        <Stack.Screen
          name="OnboardingSummary"
          component={OnboardingSummaryScreen}
          options={{ animation: 'none' }}
        />
        <Stack.Screen name="OnboardingName" component={NameScreen} />
        <Stack.Screen name="OnboardingDobLegacy" component={DobScreen} />
        <Stack.Screen name="OnboardingPrematurity" component={PrematurityScreen} />
        <Stack.Screen name="Root" component={RootMainStack} />
        <Stack.Screen name="BabyEdit" component={BabyEditScreen} />
        <Stack.Screen name="LegalPrivacy" component={LegalDocumentScreen} />
        <Stack.Screen name="LegalTerms" component={LegalDocumentScreen} />
      </Stack.Navigator>
      <OnboardingHeader
        routeName={routeName}
        navigationRef={navigationRef}
      />
    </NavigationContainer>
  );
};
