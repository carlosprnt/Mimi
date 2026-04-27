import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingScene } from '@/components/onboarding/OnboardingScene';
import { ChoiceCard } from '@/components/onboarding/ChoiceCard';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { spacing } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

export const OnboardingAtTermScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const atTerm = useOnboardingDraft((s) => s.atTerm);
  const setDraft = useOnboardingDraft((s) => s.set);

  const choose = (term: boolean) => {
    setDraft({ atTerm: term, dueDate: term ? undefined : undefined });
    navigation.navigate(term ? 'OnboardingIdentity' : 'OnboardingDueDate');
  };

  return (
    <OnboardingScene
      step={2}
      total={6}
      eyebrow={t('onboarding.atTerm.eyebrow')}
      title={t('onboarding.atTerm.title')}
      subtitle={t('onboarding.atTerm.subtitle')}
      onBack={() => navigation.goBack()}
    >
      <View style={styles.choices}>
        <ChoiceCard
          label={t('onboarding.atTerm.yes')}
          icon="checkmark-circle-outline"
          selected={atTerm === true}
          onPress={() => choose(true)}
        />
        <ChoiceCard
          label={t('onboarding.atTerm.no')}
          icon="time-outline"
          selected={atTerm === false}
          onPress={() => choose(false)}
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
