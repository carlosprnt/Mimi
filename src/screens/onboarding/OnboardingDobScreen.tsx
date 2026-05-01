import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Text, Button } from '@/components';
import { ONBOARDING_HEADER_HEIGHT } from '@/components/onboarding/OnboardingHeader';
import { ageLabel } from '@/logic/age';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { haptics } from '@/logic/haptics';
import { colors, fonts, screenGutter, spacing } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

const defaultDob = (): Date => {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  d.setHours(0, 0, 0, 0);
  return d;
};

const sixYearsAgo = (): Date =>
  new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 6);

export const OnboardingDobScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const dob = useOnboardingDraft((s) => s.dob);
  const setDraft = useOnboardingDraft((s) => s.set);
  const [androidOpen, setAndroidOpen] = useState(false);

  // Local picker value: hydrated from the draft if present, otherwise
  // a sensible default of 3 months ago. Seeded into the draft on first
  // mount so the CTA is enabled out of the box and the live age
  // preview shows immediately.
  const [pickerValue, setPickerValue] = useState<Date>(() =>
    dob ? new Date(dob) : defaultDob(),
  );

  useEffect(() => {
    if (!dob) setDraft({ dob: pickerValue.toISOString() });
    // We deliberately only run on mount; subsequent draft changes
    // come from the picker via setPickerValue → setDraft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (next?: Date) => {
    if (!next) return;
    setPickerValue(next);
    setDraft({ dob: next.toISOString() });
  };

  const liveAge = ageLabel(
    {
      id: 'preview',
      name: '',
      dateOfBirth: pickerValue.toISOString(),
    },
    new Date(),
  );

  const goNext = () => {
    haptics.light();
    navigation.navigate('OnboardingAtTerm');
  };

  return (
    <Screen backdrop="night" edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.headingWrap,
            { paddingTop: insets.top + ONBOARDING_HEADER_HEIGHT },
          ]}
        >
          <Text variant="eyebrow" tone="tertiary" style={styles.eyebrow}>
            {t('onboarding.dob.eyebrow')}
          </Text>
          <Text variant="title" align="center" style={styles.title}>
            {t('onboarding.dob.title')}
          </Text>
          <Text
            variant="callout"
            tone="secondary"
            align="center"
            style={styles.subtitle}
          >
            {t('onboarding.dob.subtitle')}
          </Text>
        </View>

        <View style={styles.middle}>
          <Text variant="display" tone="primary" style={styles.ageValue}>
            {liveAge}
          </Text>
        </View>

        <View style={styles.ctaWrap}>
          <Button
            title={t('onboarding.common.continue')}
            onPress={goNext}
            disabled={!dob}
          />
        </View>

        <View
          style={[
            styles.pickerWrap,
            { paddingBottom: Math.max(insets.bottom, spacing.sm) },
          ]}
        >
          {Platform.OS === 'ios' ? (
            <DateTimePicker
              value={pickerValue}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              minimumDate={sixYearsAgo()}
              textColor={colors.text.primary}
              themeVariant="dark"
              onChange={(_, value) => onChange(value)}
              style={styles.iosPicker}
            />
          ) : (
            <View style={styles.androidWrap}>
              <Pressable
                onPress={() => setAndroidOpen(true)}
                style={({ pressed }) => [
                  styles.androidRow,
                  pressed && styles.pressed,
                ]}
              >
                <Text variant="callout" tone="secondary">
                  {t('onboarding.dob.tapToPick')}
                </Text>
                <Text variant="body" tone="primary" tabular>
                  {pickerValue.toLocaleDateString()}
                </Text>
              </Pressable>
              {androidOpen ? (
                <DateTimePicker
                  value={pickerValue}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  minimumDate={sixYearsAgo()}
                  onChange={(_, value) => {
                    setAndroidOpen(false);
                    onChange(value);
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
  headingWrap: {
    paddingHorizontal: screenGutter,
    paddingTop: spacing.lg,
  },
  eyebrow: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    paddingHorizontal: spacing.sm,
  },
  subtitle: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: screenGutter,
  },
  ageValue: {
    fontFamily: fonts.medium,
    fontSize: 40,
    lineHeight: 48,
    textAlign: 'center',
  },
  ctaWrap: {
    paddingHorizontal: screenGutter,
    paddingBottom: spacing.md,
  },
  pickerWrap: {
    alignItems: 'center',
  },
  iosPicker: {
    width: '100%',
  },
  androidWrap: {
    paddingHorizontal: screenGutter,
    paddingBottom: spacing.lg,
    width: '100%',
  },
  androidRow: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
});
