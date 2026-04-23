import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingShell } from './OnboardingShell';
import { Text } from '@/components';
import { colors, radii, spacing } from '@/theme';
import { useBabyStore } from '@/state/babyStore';
import { RootStackParamList } from '@/navigation/types';

const OPTIONS: { label: string; value: number }[] = [
  { label: 'Born on time', value: 0 },
  { label: '2 weeks early', value: 2 },
  { label: '4 weeks early', value: 4 },
  { label: '6 weeks early', value: 6 },
  { label: '8 weeks early', value: 8 },
];

export const PrematurityScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'OnboardingPrematurity'>>();
  const [selected, setSelected] = useState<number>(0);
  const setBaby = useBabyStore((s) => s.setBaby);

  const finish = () => {
    setBaby({
      name: route.params.name,
      dateOfBirth: route.params.dob,
      prematureWeeks: selected > 0 ? selected : undefined,
    });
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  return (
    <OnboardingShell
      step={{ index: 3, total: 3 }}
      eyebrow="CORRECTED AGE"
      title="Was your baby born early?"
      subtitle="Optional — helps Mimi use a gentler wake window when it's relevant."
      onBack={() => navigation.goBack()}
      onCta={finish}
      ctaTitle="Finish setup"
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
                {opt.label}
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
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.7,
  },
});
