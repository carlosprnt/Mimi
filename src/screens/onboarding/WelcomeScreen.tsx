import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import {
  CommonActions,
  useNavigation,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingScene } from '@/components/onboarding/OnboardingScene';
import { ActionMenu, type ActionMenuItem } from '@/components/ActionMenu';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { useAuthStore } from '@/state/authStore';
import { useBabyStore } from '@/state/babyStore';
import { useGoogleSignIn } from '@/services/googleAuth';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const setDraft = useOnboardingDraft((s) => s.set);
  const startedAt = useOnboardingDraft((s) => s.startedAt);
  const [signInOpen, setSignInOpen] = useState(false);

  useEffect(() => {
    if (!startedAt) setDraft({ startedAt: new Date().toISOString() });
  }, [startedAt, setDraft]);

  const { ready: googleReady, signIn: signInWithGoogle } = useGoogleSignIn();
  const authedUser = useAuthStore((s) => s.user);
  const babiesCount = useBabyStore((s) => s.babies.length);

  // Once Google auth completes the auth store flips to signed-in.
  // - If the local baby list isn't empty (the parent had finished
  //   onboarding before signing out), jump straight to Root.
  // - Otherwise stay on Welcome so the parent finishes onboarding —
  //   without a backend (Phase B) there are no remote babies to pull,
  //   so a fresh device will always need onboarding.
  useEffect(() => {
    if (!authedUser) return;
    setSignInOpen(false);
    if (babiesCount > 0) {
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'Root' }] }),
      );
    }
  }, [authedUser, babiesCount, navigation]);

  const onApple = () => {
    setSignInOpen(false);
    Alert.alert(
      'Apple',
      'Apple Sign-In requiere un dev build. Estará disponible cuando arranquemos Phase B.',
    );
  };

  const onGoogle = async () => {
    if (!googleReady) {
      Alert.alert(
        'Google',
        'Falta configurar EXPO_PUBLIC_GOOGLE_*_CLIENT_ID en .env. Mira la guía.',
      );
      return;
    }
    setSignInOpen(false);
    await signInWithGoogle();
  };

  const signInItems: ActionMenuItem[] = [
    {
      id: 'apple',
      label: t('onboarding.summary.apple'),
      icon: 'logo-apple',
      onPress: onApple,
    },
    {
      id: 'google',
      label: t('onboarding.summary.google'),
      icon: 'logo-google',
      onPress: onGoogle,
    },
  ];

  return (
    <>
      <OnboardingScene
        step={0}
        total={6}
        title={t('onboarding.welcome.title')}
        subtitle={t('onboarding.welcome.subtitle')}
        cta={{
          label: t('onboarding.welcome.cta'),
          onPress: () => navigation.navigate('OnboardingDob'),
        }}
        secondaryCta={{
          label: t('onboarding.welcome.signIn'),
          onPress: () => setSignInOpen(true),
        }}
      />
      <ActionMenu
        visible={signInOpen}
        onClose={() => setSignInOpen(false)}
        items={signInItems}
      />
    </>
  );
};
