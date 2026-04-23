import React, { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingShell } from './OnboardingShell';
import { colors, spacing, typography } from '@/theme';
import { RootStackParamList } from '@/navigation/types';

export const NameScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [name, setName] = useState('');

  const trimmed = name.trim();

  return (
    <OnboardingShell
      step={{ index: 1, total: 3 }}
      eyebrow="YOUR BABY"
      title="What's their name?"
      subtitle="Just a first name. Mimi keeps this on your device."
      onBack={() => navigation.goBack()}
      onCta={() =>
        navigation.navigate('OnboardingDob', { name: trimmed })
      }
      ctaDisabled={trimmed.length === 0}
    >
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Name"
        placeholderTextColor={colors.text.tertiary}
        autoFocus
        autoCapitalize="words"
        autoCorrect={false}
        selectionColor={colors.accent.base}
        returnKeyType="next"
        onSubmitEditing={() => {
          if (trimmed.length > 0) {
            navigation.navigate('OnboardingDob', { name: trimmed });
          }
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
