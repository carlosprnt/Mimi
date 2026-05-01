import React from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingScene } from '@/components/onboarding/OnboardingScene';
import { ChoiceCard } from '@/components/onboarding/ChoiceCard';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { spacing } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

const STEP_IMAGE = require('../../../assets/step02.png');

export const OnboardingAtTermScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const atTerm = useOnboardingDraft((s) => s.atTerm);
  const setDraft = useOnboardingDraft((s) => s.set);
  const { width } = useWindowDimensions();
  const heroSize = Math.round(width * 0.42);

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
      hero={
        <Image
          source={STEP_IMAGE}
          style={{ width: heroSize, height: heroSize }}
          resizeMode="contain"
        />
      }
    >
      <View style={styles.choices}>
        <View style={styles.cell}>
          <ChoiceCard
            label={t('onboarding.atTerm.yes')}
            icon="checkmark-circle-outline"
            layout="column"
            selected={atTerm === true}
            onPress={() => choose(true)}
          />
        </View>
        <View style={styles.cell}>
          <ChoiceCard
            label={t('onboarding.atTerm.no')}
            icon="time-outline"
            layout="column"
            selected={atTerm === false}
            onPress={() => choose(false)}
          />
        </View>
      </View>
    </OnboardingScene>
  );
};

const styles = StyleSheet.create({
  choices: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  cell: {
    flex: 1,
  },
});
