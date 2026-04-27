import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingScene } from '@/components/onboarding/OnboardingScene';
import { DateHero } from '@/components/DateHero';
import { DateWheelSheet } from '@/components/DateWheelSheet';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

const formatShort = (d: Date): string =>
  d
    .toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    .replace('.', '');

export const OnboardingDueDateScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dob = useOnboardingDraft((s) => s.dob);
  const dueDate = useOnboardingDraft((s) => s.dueDate);
  const setDraft = useOnboardingDraft((s) => s.set);
  const [picker, setPicker] = useState(false);

  const dobDate = dob ? new Date(dob) : new Date();
  const dueDateValue = dueDate ? new Date(dueDate) : undefined;

  const onConfirm = (d: Date) => {
    setDraft({ dueDate: d.toISOString() });
    setPicker(false);
  };

  return (
    <>
      <OnboardingScene
        step={3}
        total={6}
        eyebrow={t('onboarding.dueDate.eyebrow')}
        title={t('onboarding.dueDate.title')}
        subtitle={t('onboarding.dueDate.subtitle')}
        onBack={() => navigation.goBack()}
        cta={{
          label: t('onboarding.common.continue'),
          onPress: () => navigation.navigate('OnboardingIdentity'),
          disabled: !dueDate,
        }}
      >
        <DateHero
          value={dueDateValue}
          onPress={() => setPicker(true)}
          caption={t('onboarding.dueDate.birthRef', {
            date: formatShort(dobDate),
          })}
        />
      </OnboardingScene>

      <DateWheelSheet
        visible={picker}
        initial={dueDateValue ?? defaultDue(dobDate)}
        minDate={dobDate}
        onClose={() => setPicker(false)}
        onConfirm={onConfirm}
      />
    </>
  );
};

const defaultDue = (dob: Date): Date => {
  const d = new Date(dob);
  d.setDate(d.getDate() + 21);
  return d;
};
