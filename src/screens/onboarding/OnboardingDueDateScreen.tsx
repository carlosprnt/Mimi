import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Text, Button } from '@/components';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { haptics } from '@/logic/haptics';
import { colors, fonts, screenGutter, spacing } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

const TOTAL_STEPS = 6;

const formatLong = (d: Date): string =>
  d
    .toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .replace(',', '');

export const OnboardingDueDateScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const dob = useOnboardingDraft((s) => s.dob);
  const dueDate = useOnboardingDraft((s) => s.dueDate);
  const setDraft = useOnboardingDraft((s) => s.set);
  const [androidOpen, setAndroidOpen] = useState(false);

  const dobDate = dob ? new Date(dob) : new Date();
  const defaultDue = (): Date => {
    const d = new Date(dobDate);
    d.setDate(d.getDate() + 21);
    return d;
  };

  const [pickerValue, setPickerValue] = useState<Date>(() =>
    dueDate ? new Date(dueDate) : defaultDue(),
  );

  useEffect(() => {
    if (!dueDate) setDraft({ dueDate: pickerValue.toISOString() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (next?: Date) => {
    if (!next) return;
    setPickerValue(next);
    setDraft({ dueDate: next.toISOString() });
  };

  const goNext = () => {
    haptics.light();
    navigation.navigate('OnboardingIdentity');
  };

  return (
    <Screen backdrop="night" edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={colors.text.primary}
            />
          </Pressable>
          <Text variant="footnote" tone="tertiary" style={styles.stepLabel}>
            {t('onboarding.stepOf', { step: 3, total: TOTAL_STEPS })}
          </Text>
        </View>

        <View style={styles.headingWrap}>
          <Text variant="eyebrow" tone="tertiary" style={styles.eyebrow}>
            {t('onboarding.dueDate.eyebrow')}
          </Text>
          <Text variant="title" align="center" style={styles.title}>
            {t('onboarding.dueDate.title')}
          </Text>
          <Text
            variant="callout"
            tone="secondary"
            align="center"
            style={styles.subtitle}
          >
            {t('onboarding.dueDate.subtitle')}
          </Text>
        </View>

        <View style={styles.middle}>
          <Text variant="display" tone="primary" style={styles.dateValue}>
            {formatLong(pickerValue)}
          </Text>
          <Text variant="footnote" tone="tertiary" style={styles.dobRef}>
            {t('onboarding.dueDate.birthRef', {
              date: formatLong(dobDate),
            })}
          </Text>
        </View>

        <View style={styles.ctaWrap}>
          <Button
            title={t('onboarding.common.continue')}
            onPress={goNext}
            disabled={!dueDate}
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
              minimumDate={dobDate}
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
                  minimumDate={dobDate}
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: screenGutter,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    paddingRight: spacing.sm,
  },
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
    gap: spacing.sm,
  },
  dateValue: {
    fontFamily: fonts.medium,
    fontSize: 32,
    lineHeight: 40,
    textAlign: 'center',
  },
  dobRef: {
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
