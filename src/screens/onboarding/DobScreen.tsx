import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Screen, HeaderBar, Text, Button } from '@/components';
import { colors, fonts, radii, spacing, screenGutter } from '@/theme';
import { ageLabel } from '@/logic/age';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

export const DobScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'OnboardingDobLegacy'>>();
  const name = route.params.name;
  const [dob, setDob] = useState<Date>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d;
  });
  const [androidOpen, setAndroidOpen] = useState(false);

  const liveAge = ageLabel(
    {
      id: 'preview',
      name: name || '',
      dateOfBirth: dob.toISOString(),
    },
    new Date(),
  );

  const goNext = () =>
    navigation.navigate('OnboardingPrematurity', {
      name,
      dob: dob.toISOString(),
      mode: route.params.mode,
    });

  return (
    <Screen backdrop="night">
      <HeaderBar
        title={t('onboarding.newBabyTitle')}
        leading={{
          icon: 'arrow-back',
          label: t('common.back'),
          onPress: () => navigation.goBack(),
        }}
        trailingText={t('onboarding.stepShort', { step: 2, total: 3 })}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.body}>
          <Text variant="eyebrow" tone="tertiary" style={styles.eyebrow}>
            {t('onboarding.dob.eyebrow')}
          </Text>
          <Text variant="title" style={styles.title}>
            {t('onboarding.dob.titleWithName', { name })}
          </Text>
          <Text variant="callout" tone="secondary" style={styles.subtitle}>
            {t('onboarding.dob.subtitle')}
          </Text>

          <View style={styles.ageWrap}>
            <Text variant="display" tone="primary" style={styles.ageValue}>
              {liveAge}
            </Text>
          </View>
        </View>

        <View style={styles.ctaWrap}>
          <Button title={t('common.continue')} onPress={goNext} />
        </View>

        <View style={styles.pickerWrap}>
          {Platform.OS === 'ios' ? (
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
          ) : (
            <View style={styles.androidWrap}>
              <Pressable
                onPress={() => setAndroidOpen(true)}
                style={({ pressed }) => [styles.androidRow, pressed && styles.pressed]}
              >
                <Text variant="callout" tone="secondary">
                  {t('onboarding.dob.tapToPick')}
                </Text>
                <Text variant="body" tone="primary" tabular>
                  {dob.toLocaleDateString()}
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
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: {
    paddingHorizontal: screenGutter,
    paddingTop: spacing.lg,
  },
  eyebrow: {
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text.primary,
  },
  subtitle: {
    marginTop: spacing.md,
  },
  ageWrap: {
    flex: 1,
    minHeight: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  ageValue: {
    fontFamily: fonts.medium,
    fontSize: 36,
    lineHeight: 42,
    textAlign: 'center',
  },
  ctaWrap: {
    paddingHorizontal: screenGutter,
    paddingBottom: spacing.md,
  },
  pickerWrap: {
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  androidWrap: {
    paddingHorizontal: screenGutter,
    width: '100%',
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
