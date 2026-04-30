import React, { useEffect, useRef, useState } from 'react';
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
  type OnboardingDraft,
} from '@/state/onboardingDraft';
import { useBabyStore } from '@/state/babyStore';
import { useAuthStore } from '@/state/authStore';
import { signInWithGoogle } from '@/services/auth';
import { insertBabyFromDraft, upsertProfile } from '@/services/babies';
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

const draftIsComplete = (d: OnboardingDraft): boolean =>
  !!d.name && !!d.dob && d.atTerm !== undefined && d.sex !== undefined;

export const OnboardingSummaryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const draft = useOnboardingDraft();
  const addBaby = useBabyStore((s) => s.addBaby);
  const addBabyWithId = useBabyStore((s) => s.addBabyWithId);
  const clearDraft = useOnboardingDraft((s) => s.clear);
  const authedUser = useAuthStore((s) => s.user);
  const isFocused = useIsFocused();
  const [busy, setBusy] = useState(false);
  const finalizedRef = useRef(false);

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

  const finalizeLocal = (): boolean => {
    if (!draftIsComplete(draft)) return false;
    const prematureWeeks =
      draft.atTerm === false
        ? computePrematureWeeks(draft.dob!, draft.dueDate)
        : undefined;
    addBaby({
      name: draft.name!.trim(),
      dateOfBirth: draft.dob!,
      prematureWeeks,
      sex: draft.sex,
    });
    clearDraft();
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Root' }] }),
    );
    return true;
  };

  // Once Google auth completes (authedUser flips on this focused screen)
  // persist the baby to Supabase, mirror it locally, and reset to Root.
  // Guarded with a ref so a re-focus doesn't double-write.
  useEffect(() => {
    if (!isFocused || !authedUser || finalizedRef.current) return;
    if (!draftIsComplete(draft)) return;
    finalizedRef.current = true;
    (async () => {
      await upsertProfile(authedUser.id, {
        email: authedUser.email,
        displayName: authedUser.name,
        provider: authedUser.provider,
      });
      const baby = await insertBabyFromDraft(authedUser.id, draft);
      if (baby) {
        addBabyWithId(baby);
      } else {
        // Fall back to a local-only baby if Supabase write failed.
        const prematureWeeks =
          draft.atTerm === false
            ? computePrematureWeeks(draft.dob!, draft.dueDate)
            : undefined;
        addBaby({
          name: draft.name!.trim(),
          dateOfBirth: draft.dob!,
          prematureWeeks,
          sex: draft.sex,
        });
      }
      clearDraft();
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'Root' }] }),
      );
    })();
  }, [
    isFocused,
    authedUser,
    draft,
    navigation,
    addBaby,
    addBabyWithId,
    clearDraft,
  ]);

  const onApple = () => {
    Alert.alert(
      t('onboarding.welcome.appleAlertTitle'),
      t('onboarding.welcome.appleAlertBody'),
    );
  };

  const onGoogle = async () => {
    if (busy) return;
    setBusy(true);
    const result = await signInWithGoogle();
    setBusy(false);
    if (!result.ok && result.reason !== 'cancelled') {
      Alert.alert(
        t('onboarding.welcome.googleAlertTitle'),
        result.message ?? t('onboarding.welcome.googleErrorFallback'),
      );
    }
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
        <ListRow label={t('onboarding.summary.rowSex')} value={sexLabel} />
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
          disabled={busy}
        />
      </View>

      <View style={styles.devSkip}>
        <Text
          variant="footnote"
          tone="accent"
          align="center"
          onPress={finalizeLocal}
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
