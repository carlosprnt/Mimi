import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingScene } from '@/components/onboarding/OnboardingScene';
import { ActionMenu, type ActionMenuItem } from '@/components/ActionMenu';
import { useOnboardingDraft } from '@/state/onboardingDraft';
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

  // Auth handlers are placeholders until Phase B wires Supabase + Apple +
  // Google. The sheet closes on tap so the UI flow is finished; the
  // actual sign-in call replaces this no-op later.
  const onApple = () => {
    setSignInOpen(false);
  };
  const onGoogle = () => {
    setSignInOpen(false);
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
