import React, { useEffect, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Text, Button } from '@/components';
import { ONBOARDING_HEADER_HEIGHT } from '@/components/onboarding/OnboardingHeader';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { haptics } from '@/logic/haptics';
import { colors, fonts, screenGutter, spacing } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

const MIN_NAME_LENGTH = 2;

export const OnboardingIdentityScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const name = useOnboardingDraft((s) => s.name) ?? '';
  const setDraft = useOnboardingDraft((s) => s.set);
  const inputRef = useRef<TextInput>(null);

  // Re-focus the input each time the screen appears so the keyboard
  // is always up. Using a small timeout because instant focus during
  // navigation transitions is sometimes ignored on iOS.
  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(id);
  }, []);

  const trimmed = name.trim();
  const canContinue = trimmed.length >= MIN_NAME_LENGTH;

  const goNext = () => {
    if (!canContinue) return;
    haptics.light();
    navigation.navigate('OnboardingSex');
  };

  return (
    <Screen backdrop="night" edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.body,
            { paddingTop: insets.top + ONBOARDING_HEADER_HEIGHT },
          ]}
        >
          <Text variant="eyebrow" tone="tertiary" style={styles.eyebrow}>
            {t('onboarding.identity.eyebrow')}
          </Text>
          <Text variant="title" align="center" style={styles.title}>
            {t('onboarding.identity.title')}
          </Text>
          <Text
            variant="callout"
            tone="secondary"
            align="center"
            style={styles.subtitle}
          >
            {t('onboarding.identity.subtitle')}
          </Text>

          <View style={styles.inputWrap}>
            <TextInput
              ref={inputRef}
              value={name}
              onChangeText={(v) => setDraft({ name: v })}
              placeholder={t('onboarding.identity.placeholder')}
              placeholderTextColor={colors.text.tertiary}
              autoCapitalize="words"
              autoCorrect={false}
              selectionColor={colors.accent.base}
              returnKeyType="next"
              onSubmitEditing={goNext}
              style={styles.input}
            />
          </View>
        </View>

        <View
          style={[
            styles.ctaWrap,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
        >
          <Button
            title={t('onboarding.common.continue')}
            onPress={goNext}
            disabled={!canContinue}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: {
    flex: 1,
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
    marginBottom: spacing.xxl,
  },
  inputWrap: {
    paddingHorizontal: spacing.md,
  },
  input: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: 36,
    lineHeight: 44,
    paddingVertical: spacing.md,
    borderBottomColor: 'rgba(255,255,255,0.16)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    textAlign: 'center',
  },
  ctaWrap: {
    paddingHorizontal: screenGutter,
    paddingTop: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
});
