import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { OnboardingShell } from './OnboardingShell';
import { Text } from '@/components';
import { colors, radii, spacing } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

export const DobScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'OnboardingDob'>>();
  const [dob, setDob] = useState<Date>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d;
  });
  const [androidOpen, setAndroidOpen] = useState(false);

  const formatted = dob.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <OnboardingShell
      step={{ index: 2, total: 3 }}
      eyebrow={t('onboarding.dob.eyebrow')}
      title={t('onboarding.dob.title')}
      subtitle={t('onboarding.dob.subtitle')}
      onBack={() => navigation.goBack()}
      onCta={() =>
        navigation.navigate('OnboardingPrematurity', {
          name: route.params.name,
          dob: dob.toISOString(),
          mode: route.params.mode,
        })
      }
    >
      {Platform.OS === 'ios' ? (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={dob}
            mode="date"
            display="spinner"
            maximumDate={new Date()}
            minimumDate={new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 6)}
            textColor={colors.text.primary}
            themeVariant="dark"
            onChange={(_, value) => value && setDob(value)}
          />
        </View>
      ) : (
        <View>
          <Pressable
            onPress={() => setAndroidOpen(true)}
            style={({ pressed }) => [styles.androidRow, pressed && styles.pressed]}
          >
            <Text variant="callout" tone="secondary">
              {t('onboarding.dob.selectedDate')}
            </Text>
            <Text variant="body" tone="primary" tabular>
              {formatted}
            </Text>
          </Pressable>
          {androidOpen ? (
            <DateTimePicker
              value={dob}
              mode="date"
              display="default"
              maximumDate={new Date()}
              minimumDate={new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 6)}
              onChange={(_, value) => {
                setAndroidOpen(false);
                if (value) setDob(value);
              }}
            />
          ) : null}
        </View>
      )}
      {Platform.OS === 'ios' ? (
        <Text variant="footnote" tone="tertiary" align="center" style={styles.hint}>
          {formatted}
        </Text>
      ) : null}
    </OnboardingShell>
  );
};

const styles = StyleSheet.create({
  pickerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    marginTop: spacing.base,
  },
  androidRow: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
});
