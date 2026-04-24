import React, { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingShell } from './OnboardingShell';
import { colors, spacing, typography } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

export const NameScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'OnboardingName'>>();
  const mode = route.params?.mode;
  const [name, setName] = useState('');

  const trimmed = name.trim();

  const next = () =>
    navigation.navigate('OnboardingDob', { name: trimmed, mode });

  return (
    <OnboardingShell
      step={{ index: 1, total: 3 }}
      eyebrow={t('onboarding.name.eyebrow')}
      title={t('onboarding.name.title')}
      subtitle={t('onboarding.name.subtitle')}
      onBack={() => navigation.goBack()}
      onCta={next}
      ctaDisabled={trimmed.length === 0}
    >
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={t('onboarding.name.placeholder')}
        placeholderTextColor={colors.text.tertiary}
        autoFocus
        autoCapitalize="words"
        autoCorrect={false}
        selectionColor={colors.accent.base}
        returnKeyType="next"
        onSubmitEditing={() => {
          if (trimmed.length > 0) next();
        }}
        style={styles.input}
      />
    </OnboardingShell>
  );
};

const styles = StyleSheet.create({
  input: {
    ...typography.title,
    color: colors.text.primary,
    paddingVertical: spacing.md,
    borderBottomColor: colors.border.hairline,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
