import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingShell } from './OnboardingShell';
import { Text } from '@/components';
import { colors, fonts, radii, spacing } from '@/theme';
import { useBabyStore } from '@/state/babyStore';
import { RootStackParamList } from '@/navigation/types';
import { t, type TranslationKey } from '@/i18n';

const OPTIONS: { labelKey: TranslationKey; value: number }[] = [
  { labelKey: 'onboarding.prematurity.options.onTime', value: 0 },
  { labelKey: 'onboarding.prematurity.options.weeks2', value: 2 },
  { labelKey: 'onboarding.prematurity.options.weeks4', value: 4 },
  { labelKey: 'onboarding.prematurity.options.weeks6', value: 6 },
  { labelKey: 'onboarding.prematurity.options.weeks8', value: 8 },
];

export const PrematurityScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'OnboardingPrematurity'>>();
  const [selected, setSelected] = useState<number>(0);
  const addBaby = useBabyStore((s) => s.addBaby);
  const setActiveBabyId = useBabyStore((s) => s.setActiveBabyId);

  const finish = () => {
    const created = addBaby({
      name: route.params.name,
      dateOfBirth: route.params.dob,
      prematureWeeks: selected > 0 ? selected : undefined,
    });
    setActiveBabyId(created.id);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Root' }],
    });
  };

  return (
    <OnboardingShell
      step={{ index: 3, total: 3 }}
      eyebrow={t('onboarding.prematurity.eyebrow')}
      title={t('onboarding.prematurity.title')}
      subtitle={t('onboarding.prematurity.subtitle')}
      onBack={() => navigation.goBack()}
      onCta={finish}
      ctaTitle={t('onboarding.prematurity.finishSetup')}
    >
      <View style={styles.list}>
        {OPTIONS.map((opt) => {
          const isSelected = opt.value === selected;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setSelected(opt.value)}
              style={({ pressed }) => [
                styles.option,
                isSelected && styles.optionSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text
                variant="body"
                tone={isSelected ? 'primary' : 'secondary'}
                style={isSelected ? styles.selectedLabel : undefined}
              >
                {t(opt.labelKey)}
              </Text>
              {isSelected ? (
                <Text variant="body" tone="accent">
                  ✓
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </OnboardingShell>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  option: {
    height: 56,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg.elevated,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSelected: {
    backgroundColor: colors.bg.elevated,
    borderColor: colors.accent.base,
    borderWidth: 1,
  },
  selectedLabel: {
    fontFamily: fonts.medium,
  },
  pressed: {
    opacity: 0.7,
  },
});
