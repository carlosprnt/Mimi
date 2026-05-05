import { createNavigationContainerRef } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function resetToOnboardingWelcome(): void {
  if (!navigationRef.isReady()) return;
  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'OnboardingWelcome' }],
    }),
  );
}
