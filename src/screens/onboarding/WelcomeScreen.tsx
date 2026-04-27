import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingScene } from '@/components/onboarding/OnboardingScene';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const setDraft = useOnboardingDraft((s) => s.set);
  const startedAt = useOnboardingDraft((s) => s.startedAt);

  useEffect(() => {
    if (!startedAt) setDraft({ startedAt: new Date().toISOString() });
  }, [startedAt, setDraft]);

  return (
    <OnboardingScene
      step={0}
      total={6}
      title={t('onboarding.welcome.title')}
      subtitle={t('onboarding.welcome.subtitle')}
      cta={{
        label: t('onboarding.welcome.cta'),
        onPress: () => navigation.navigate('OnboardingDob'),
      }}
    />
  );
};
