import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { useBabyStore } from '@/state/babyStore';
import { HomeScreen } from '@/screens/HomeScreen';
import { HistoryScreen } from '@/screens/HistoryScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { WelcomeScreen } from '@/screens/onboarding/WelcomeScreen';
import { NameScreen } from '@/screens/onboarding/NameScreen';
import { DobScreen } from '@/screens/onboarding/DobScreen';
import { PrematurityScreen } from '@/screens/onboarding/PrematurityScreen';
import { colors } from '@/theme';
import { DrawerContent } from './DrawerContent';
import { DrawerParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

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

const RootDrawer: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: colors.bg.base,
          width: 280,
        },
        sceneStyle: {
          backgroundColor: colors.bg.base,
        },
        drawerType: 'front',
        overlayColor: 'rgba(0,0,0,0.4)',
        swipeEnabled: true,
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="History" component={HistoryScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
    </Drawer.Navigator>
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
        <Stack.Screen name="OnboardingName" component={NameScreen} />
        <Stack.Screen name="OnboardingDob" component={DobScreen} />
        <Stack.Screen name="OnboardingPrematurity" component={PrematurityScreen} />
        <Stack.Screen name="Root" component={RootDrawer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
