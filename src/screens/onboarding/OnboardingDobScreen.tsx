import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingScene } from '@/components/onboarding/OnboardingScene';
import { DateHero } from '@/components/DateHero';
import { DateWheelSheet } from '@/components/DateWheelSheet';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { ageLabel } from '@/logic/age';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

export const OnboardingDobScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dob = useOnboardingDraft((s) => s.dob);
  const setDraft = useOnboardingDraft((s) => s.set);
  const [picker, setPicker] = useState(false);

  const dobDate = dob ? new Date(dob) : undefined;
  const caption = dobDate
    ? ageLabel({
        id: 'preview',
        name: '',
        dateOfBirth: dobDate.toISOString(),
      })
    : undefined;

  const onConfirm = (d: Date) => {
    setDraft({ dob: d.toISOString() });
    setPicker(false);
  };

  return (
    <>
      <OnboardingScene
        step={1}
        total={6}
        eyebrow={t('onboarding.dob.eyebrow')}
        title={t('onboarding.dob.title')}
        subtitle={t('onboarding.dob.subtitle')}
        onBack={() => navigation.goBack()}
        cta={{
          label: t('onboarding.common.continue'),
          onPress: () => navigation.navigate('OnboardingAtTerm'),
          disabled: !dob,
        }}
      >
        <DateHero
          value={dobDate}
          onPress={() => setPicker(true)}
          caption={caption}
        />
      </OnboardingScene>

      <DateWheelSheet
        visible={picker}
        initial={dobDate ?? defaultDob()}
        maxDate={new Date()}
        onClose={() => setPicker(false)}
        onConfirm={onConfirm}
      />
    </>
  );
};

const defaultDob = (): Date => {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d;
};
