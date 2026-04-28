import type { NavigatorScreenParams } from '@react-navigation/native';

export type DrawerParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Root: NavigatorScreenParams<DrawerParamList>;
  OnboardingWelcome: undefined;
  OnboardingDob: undefined;
  OnboardingAtTerm: undefined;
  OnboardingDueDate: undefined;
  OnboardingIdentity: undefined;
  OnboardingSummary: undefined;
  // Legacy routes kept for the addChild flow from the drawer.
  OnboardingName: { mode?: 'addChild' } | undefined;
  OnboardingDobLegacy: { name: string; mode?: 'addChild' };
  OnboardingPrematurity: { name: string; dob: string; mode?: 'addChild' };
  BabyEdit: { babyId: string };
};
