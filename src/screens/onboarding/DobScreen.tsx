import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, HeaderBar, Text, Button } from '@/components';
import { colors, fonts, radii, spacing, screenGutter } from '@/theme';
import { ageLabel } from '@/logic/age';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

export const DobScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'OnboardingDobLegacy'>>();
  const insets = useSafeAreaInsets();
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
          icon: 'close',
          label: t('common.close'),
          onPress: () =>
            navigation.reset({ index: 0, routes: [{ name: 'Root' }] }),
        }}
        trailingText={t('onboarding.stepShort', { step: 2, total: 3 })}
      />

      <View style={styles.headingWrap}>
        <Text variant="eyebrow" tone="tertiary" style={styles.eyebrow}>
          {t('onboarding.dob.eyebrow')}
        </Text>
        <Text variant="title" style={styles.title}>
          {t('onboarding.dob.titleWithName', { name })}
        </Text>
        <Text variant="callout" tone="secondary" style={styles.subtitle}>
          {t('onboarding.dob.subtitle')}
        </Text>
      </View>

      {/* Middle: live age display, fills the gap between heading and CTA */}
      <View style={styles.middle}>
        <Text variant="display" tone="primary" style={styles.ageValue}>
          {liveAge}
        </Text>
      </View>

      {/* Bottom: CTA, then picker docked at the very bottom */}
      <View style={styles.ctaWrap}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={({ pressed }) => [
            styles.prevBtn,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </Pressable>
        <View style={styles.ctaFlex}>
          <Button title={t('common.continue')} onPress={goNext} />
        </View>
      </View>

      <View
        style={[
          styles.pickerWrap,
          { paddingBottom: Math.max(insets.bottom, spacing.sm) },
        ]}
      >
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
    </Screen>
  );
};

const styles = StyleSheet.create({
  headingWrap: {
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
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: screenGutter,
  },
  ageValue: {
    fontFamily: fonts.medium,
    fontSize: 44,
    lineHeight: 52,
    textAlign: 'center',
  },
  ctaWrap: {
    paddingHorizontal: screenGutter,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ctaFlex: { flex: 1 },
  prevBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 165, 230, 0.35)',
    backgroundColor: 'rgba(168, 165, 230, 0.08)',
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
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
});
