import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
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

  // Phase A: auth not wired yet; for local dev we let the user finish the
  // onboarding without an account so the rest of the app is reachable.
  // Phase B will replace this with the real auth handoff.
  const finishWithoutAuth = () => {
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
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Root' }],
      }),
    );
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
        <AuthButton provider="apple" label={t('onboarding.summary.apple')} disabled />
        <AuthButton provider="google" label={t('onboarding.summary.google')} disabled />
        <Text
          variant="footnote"
          tone="tertiary"
          align="center"
          style={styles.authNote}
        >
          {t('onboarding.summary.authComingSoon')}
        </Text>
      </View>

      <View style={styles.devSkip}>
        <Text
          variant="footnote"
          tone="accent"
          align="center"
          onPress={finishWithoutAuth}
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
  authNote: {
    marginTop: spacing.sm,
  },
  devSkip: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
});
