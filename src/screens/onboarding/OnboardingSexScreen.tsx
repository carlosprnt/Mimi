import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingScene } from '@/components/onboarding/OnboardingScene';
import { ChoiceCard } from '@/components/onboarding/ChoiceCard';
import { useOnboardingDraft, Sex } from '@/state/onboardingDraft';
import { spacing } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

const TOTAL_STEPS = 6;

export const OnboardingSexScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const sex = useOnboardingDraft((s) => s.sex);
  const setDraft = useOnboardingDraft((s) => s.set);

  const choose = (next: Sex) => {
    setDraft({ sex: next });
    navigation.navigate('OnboardingSummary');
  };

  return (
    <OnboardingScene
      step={5}
      total={TOTAL_STEPS}
      eyebrow={t('onboarding.sex.eyebrow')}
      title={t('onboarding.sex.title')}
      subtitle={t('onboarding.sex.subtitle')}
      onBack={() => navigation.goBack()}
      illustrationSex={sex === 'girl' || sex === 'boy' ? sex : undefined}
    >
      <View style={styles.choices}>
        <ChoiceCard
          label={t('onboarding.sex.girl')}
          icon="rose-outline"
          selected={sex === 'girl'}
          onPress={() => choose('girl')}
        />
        <ChoiceCard
          label={t('onboarding.sex.boy')}
          icon="cloud-outline"
          selected={sex === 'boy'}
          onPress={() => choose('boy')}
        />
        <ChoiceCard
          label={t('onboarding.sex.preferNotToSay')}
          icon="help-outline"
          selected={sex === 'unspecified'}
          onPress={() => choose('unspecified')}
        />
      </View>
    </OnboardingScene>
  );
};

const styles = StyleSheet.create({
  choices: {
    gap: spacing.md,
    paddingTop: spacing.md,
  },
});
