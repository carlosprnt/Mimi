import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import {
  CommonActions,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingScene } from '@/components/onboarding/OnboardingScene';
import { ActionMenu, type ActionMenuItem } from '@/components/ActionMenu';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { useAuthStore } from '@/state/authStore';
import { useBabyStore } from '@/state/babyStore';
import {
  isAppleSignInAvailable,
  signInWithApple,
  signInWithGoogle,
} from '@/services/auth';
import { listBabies } from '@/services/babies';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const setDraft = useOnboardingDraft((s) => s.set);
  const startedAt = useOnboardingDraft((s) => s.startedAt);
  const [signInOpen, setSignInOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (!startedAt) setDraft({ startedAt: new Date().toISOString() });
  }, [startedAt, setDraft]);

  useEffect(() => {
    void isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  const authedUser = useAuthStore((s) => s.user);
  const setBabies = useBabyStore((s) => s.setBabies);
  const isFocused = useIsFocused();

  // After OAuth (Google or Apple) completes, the auth store flips to
  // signed-in. Pull this user's babies from Supabase:
  //   - If any exist, jump to Root (the dashboard).
  //   - Otherwise hand off to onboarding so the user can create their
  //     first baby. No alert — the transition is automatic.
  useEffect(() => {
    if (!isFocused || !authedUser) return;
    setSignInOpen(false);
    (async () => {
      const remote = await listBabies(authedUser.id);
      if (remote.length > 0) {
        setBabies(remote);
        navigation.dispatch(
          CommonActions.reset({ index: 0, routes: [{ name: 'Root' }] }),
        );
        return;
      }
      navigation.navigate('OnboardingDob');
    })();
  }, [isFocused, authedUser, navigation, setBabies]);

  const onApple = async () => {
    if (busy) return;
    setSignInOpen(false);
    setBusy(true);
    const result = await signInWithApple();
    setBusy(false);
    if (!result.ok && result.reason !== 'cancelled') {
      Alert.alert(
        t('onboarding.welcome.appleAlertTitle'),
        result.message ?? t('onboarding.welcome.googleErrorFallback'),
      );
    }
  };

  const onGoogle = async () => {
    if (busy) return;
    setSignInOpen(false);
    setBusy(true);
    const result = await signInWithGoogle();
    setBusy(false);
    if (!result.ok && result.reason !== 'cancelled') {
      Alert.alert(
        t('onboarding.welcome.googleAlertTitle'),
        result.message ?? t('onboarding.welcome.googleErrorFallback'),
      );
    }
  };

  const signInItems: ActionMenuItem[] = [
    ...(appleAvailable
      ? [
          {
            id: 'apple',
            label: t('onboarding.summary.apple'),
            icon: 'logo-apple' as const,
            onPress: onApple,
          },
        ]
      : []),
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
