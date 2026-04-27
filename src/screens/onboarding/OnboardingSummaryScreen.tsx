import React, { useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import {
  CommonActions,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingScene } from '@/components/onboarding/OnboardingScene';
import { AuthButton } from '@/components/onboarding/AuthButton';
import { Text } from '@/components/Text';
import { ListRow } from '@/components/ListRow';
import { Card } from '@/components/Card';
import {
  useOnboardingDraft,
  computePrematureWeeks,
} from '@/state/onboardingDraft';
import { useBabyStore } from '@/state/babyStore';
import { useAuthStore } from '@/state/authStore';
import { useGoogleSignIn } from '@/services/googleAuth';
import { spacing } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

const formatLong = (iso?: string): string => {
  if (!iso) return '—';
  return new Date(iso)
    .toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .replace(',', '');
};

export const OnboardingSummaryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const draft = useOnboardingDraft();
  const addBaby = useBabyStore((s) => s.addBaby);
  const clearDraft = useOnboardingDraft((s) => s.clear);
  const authedUser = useAuthStore((s) => s.user);
  const { ready: googleReady, signIn: signInWithGoogle } = useGoogleSignIn();
  const isFocused = useIsFocused();

  const sexLabel =
    draft.sex === 'girl'
      ? t('onboarding.summary.sexGirl')
      : draft.sex === 'boy'
        ? t('onboarding.summary.sexBoy')
        : '—';

  const atTermLabel =
    draft.atTerm === true
      ? t('onboarding.summary.rowAtTermYes')
      : draft.atTerm === false
        ? t('onboarding.summary.rowAtTermNo')
        : '—';

  const finalize = () => {
    if (!draft.name || !draft.dob || draft.sex === undefined) return;
    const prematureWeeks =
      draft.atTerm === false
        ? computePrematureWeeks(draft.dob, draft.dueDate)
        : undefined;
    addBaby({
      name: draft.name.trim(),
      dateOfBirth: draft.dob,
      prematureWeeks,
      sex: draft.sex,
    });
    clearDraft();
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Root' }] }),
    );
  };

  // When Google auth finishes (authedUser flips to non-null) AND the
  // user is on this screen, finalize the onboarding: persist the baby
  // from the draft and route to Root. useIsFocused guards against the
  // Welcome screen's effect firing for the same auth event.
  useEffect(() => {
    if (!isFocused || !authedUser) return;
    finalize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused, authedUser]);

  const onApple = () => {
    Alert.alert(
      'Apple',
      'Apple Sign-In requiere un dev build. Estará disponible cuando arranquemos Phase B.',
    );
  };

  const onGoogle = async () => {
    if (!googleReady) {
      Alert.alert(
        'Google',
        'Falta configurar EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID en .env.',
      );
      return;
    }
    await signInWithGoogle();
  };

  return (
    <OnboardingScene
      step={5}
      total={6}
      eyebrow={t('onboarding.summary.eyebrow')}
      title={t('onboarding.summary.title')}
      subtitle={t('onboarding.summary.subtitle', {
        name: draft.name?.trim() ?? '',
      })}
      onBack={() => navigation.goBack()}
      illustrationSex={draft.sex}
      scrollable
    >
      <Card variant="bordered" tone="night" style={styles.summary}>
        <ListRow
          label={t('onboarding.summary.rowName')}
          value={draft.name?.trim() || '—'}
        />
        <ListRow
          label={t('onboarding.summary.rowSex')}
          value={sexLabel}
        />
        <ListRow
          label={t('onboarding.summary.rowDob')}
          value={formatLong(draft.dob)}
        />
        <ListRow
          label={t('onboarding.summary.rowAtTerm')}
          value={atTermLabel}
          showDivider={draft.atTerm === false}
        />
        {draft.atTerm === false ? (
          <ListRow
            label={t('onboarding.summary.rowDueDate')}
            value={formatLong(draft.dueDate)}
            showDivider={false}
          />
        ) : null}
      </Card>

      <Text
        variant="footnote"
        tone="tertiary"
        align="center"
        style={styles.disclaimer}
      >
        {t('onboarding.summary.disclaimer')}
      </Text>

      <View style={styles.auth}>
        <AuthButton
          provider="apple"
          label={t('onboarding.summary.apple')}
          onPress={onApple}
        />
        <AuthButton
          provider="google"
          label={t('onboarding.summary.google')}
          onPress={onGoogle}
        />
      </View>

      <View style={styles.devSkip}>
        <Text
          variant="footnote"
          tone="accent"
          align="center"
          onPress={finalize}
        >
          {t('onboarding.common.continue')} →
        </Text>
      </View>
    </OnboardingScene>
  );
};

const styles = StyleSheet.create({
  summary: {
    marginBottom: spacing.lg,
  },
  disclaimer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  auth: {
    gap: spacing.sm,
  },
  devSkip: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
});
