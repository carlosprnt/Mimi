import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingScene } from '@/components/onboarding/OnboardingScene';
import { OnboardingTextField } from '@/components/onboarding/OnboardingTextField';
import { ChoiceCard } from '@/components/onboarding/ChoiceCard';
import { Text } from '@/components/Text';
import { useOnboardingDraft, Sex } from '@/state/onboardingDraft';
import { spacing } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

const MIN_NAME_LENGTH = 2;

export const OnboardingIdentityScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const name = useOnboardingDraft((s) => s.name) ?? '';
  const sex = useOnboardingDraft((s) => s.sex);
  const setDraft = useOnboardingDraft((s) => s.set);

  const trimmed = name.trim();
  const canContinue = trimmed.length >= MIN_NAME_LENGTH && sex !== undefined;

  const chooseSex = (next: Sex) => setDraft({ sex: next });

  return (
    <OnboardingScene
      step={4}
      total={6}
      eyebrow={t('onboarding.identity.eyebrow')}
      title={t('onboarding.identity.title')}
      subtitle={t('onboarding.identity.subtitle')}
      onBack={() => navigation.goBack()}
      cta={{
        label: t('onboarding.common.continue'),
        onPress: () => navigation.navigate('OnboardingSummary'),
        disabled: !canContinue,
      }}
      illustrationSex={sex}
      scrollable
    >
      <OnboardingTextField
        value={name}
        onChangeText={(v) => setDraft({ name: v })}
        placeholder={t('onboarding.identity.placeholder')}
      />

      <View style={styles.sexBlock}>
        <Text variant="eyebrow" tone="tertiary" style={styles.sexLabel}>
          {t('onboarding.identity.sexLabel')}
        </Text>
        <View style={styles.sexChoices}>
          <View style={styles.sexCell}>
            <ChoiceCard
              label={t('onboarding.identity.girl')}
              selected={sex === 'girl'}
              onPress={() => chooseSex('girl')}
            />
          </View>
          <View style={styles.sexCell}>
            <ChoiceCard
              label={t('onboarding.identity.boy')}
              selected={sex === 'boy'}
              onPress={() => chooseSex('boy')}
            />
          </View>
        </View>
      </View>
    </OnboardingScene>
  );
};

const styles = StyleSheet.create({
  sexBlock: {
    marginTop: spacing.xxl,
  },
  sexLabel: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  sexChoices: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sexCell: {
    flex: 1,
  },
});
