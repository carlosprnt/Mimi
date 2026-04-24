import type { NavigatorScreenParams } from '@react-navigation/native';

export type DrawerParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Root: NavigatorScreenParams<DrawerParamList>;
  OnboardingWelcome: undefined;
  OnboardingName: { mode?: 'addChild' } | undefined;
  OnboardingDob: { name: string; mode?: 'addChild' };
  OnboardingPrematurity: { name: string; dob: string; mode?: 'addChild' };
};
