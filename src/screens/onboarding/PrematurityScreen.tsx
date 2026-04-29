import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { OnboardingShell } from './OnboardingShell';
import { Text } from '@/components';
import { fonts, radii, spacing } from '@/theme';
import { useBabyStore } from '@/state/babyStore';
import { useCelebrationStore } from '@/state/celebrationStore';
import { haptics } from '@/logic/haptics';
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
  // null means "no option selected" (this step is optional). 0 by default.
  const [selected, setSelected] = useState<number | null>(0);
  const addBaby = useBabyStore((s) => s.addBaby);
  const setActiveBabyId = useBabyStore((s) => s.setActiveBabyId);

  const finish = () => {
    const created = addBaby({
      name: route.params.name,
      dateOfBirth: route.params.dob,
      prematureWeeks: selected && selected > 0 ? selected : undefined,
    });
    setActiveBabyId(created.id);
    useCelebrationStore.getState().trigger(created.id);
    haptics.success();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Root' }],
    });
  };

  const togglePick = (value: number) => {
    haptics.selection();
    setSelected((cur) => (cur === value ? null : value));
  };

  return (
    <OnboardingShell
      step={{ index: 3, total: 3 }}
      eyebrow={t('onboarding.prematurity.eyebrow')}
      bodyTitle={t('onboarding.prematurity.titleWithName', {
        name: route.params.name,
      })}
      subtitle={t('onboarding.prematurity.subtitle')}
      onClose={() =>
        navigation.reset({ index: 0, routes: [{ name: 'Root' }] })
      }
      onPrevStep={() => navigation.goBack()}
      onCta={finish}
      ctaTitle={t('onboarding.prematurity.createProfile')}
      ctaGlow
    >
      <View style={styles.list}>
        {OPTIONS.map((opt) => {
          const isSelected = opt.value === selected;
          return (
            <Pressable
              key={opt.value}
              onPress={() => togglePick(opt.value)}
              style={({ pressed }) => [
                styles.optionWrap,
                pressed && styles.pressed,
              ]}
            >
              <BlurView
                intensity={Platform.OS === 'ios' ? 24 : 14}
                tint="dark"
                experimentalBlurMethod="dimezisBlurView"
                style={StyleSheet.absoluteFill}
              />
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  styles.optionTint,
                  isSelected && styles.optionTintSelected,
                ]}
              />
              <View style={styles.optionInner}>
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
              </View>
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
  optionWrap: {
    height: 56,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(120, 145, 220, 0.22)',
  },
  optionTint: {
    backgroundColor: 'rgba(20, 35, 90, 0.55)',
  },
  optionTintSelected: {
    backgroundColor: 'rgba(40, 50, 130, 0.70)',
  },
  optionInner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedLabel: {
    fontFamily: fonts.medium,
  },
  pressed: {
    opacity: 0.75,
  },
});
