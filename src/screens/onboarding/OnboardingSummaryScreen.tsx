import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CommonActions,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Screen,
  Text,
  Button,
  Card,
  ListRow,
  Sheet,
  OrbitShine,
} from '@/components';
import {
  useOnboardingDraft,
  computePrematureWeeks,
  normalizeSexForBaby,
  type OnboardingDraft,
} from '@/state/onboardingDraft';
import { useBabyStore } from '@/state/babyStore';
import { useAuthStore } from '@/state/authStore';
import {
  isAppleSignInAvailable,
  signInWithApple,
  signInWithGoogle,
} from '@/services/auth';
import {
  insertBabyFromDraft,
  listBabies,
  upsertProfile,
} from '@/services/babies';
import { pushLocalToRemote } from '@/services/pushLocalToRemote';
import { haptics } from '@/logic/haptics';
import { colors, fonts, screenGutter, spacing } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

const TOTAL_STEPS = 6;

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
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const draft = useOnboardingDraft();
  const addBaby = useBabyStore((s) => s.addBaby);
  const addBabyWithId = useBabyStore((s) => s.addBabyWithId);
  const setBabies = useBabyStore((s) => s.setBabies);
  const clearDraft = useOnboardingDraft((s) => s.clear);
  const authedUser = useAuthStore((s) => s.user);
  const isFocused = useIsFocused();

  const [busy, setBusy] = useState(false);
  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    void isAppleSignInAvailable().then(setAppleAvailable);
  }, []);
  const finalizedRef = useRef(false);

  const sexLabel =
    draft.sex === 'girl'
      ? t('onboarding.summary.sexGirl')
      : draft.sex === 'boy'
        ? t('onboarding.summary.sexBoy')
        : draft.sex === 'unspecified'
          ? t('onboarding.sex.preferNotToSay')
          : '—';

  const atTermLabel =
    draft.atTerm === true
      ? t('onboarding.summary.rowAtTermYes')
      : draft.atTerm === false
        ? t('onboarding.summary.rowAtTermNo')
        : '—';

  const finalizeLocal = (): void => {
    if (!draftIsComplete(draft)) return;
    const prematureWeeks =
      draft.atTerm === false
        ? computePrematureWeeks(draft.dob!, draft.dueDate)
        : undefined;
    addBaby({
      name: draft.name!.trim(),
      dateOfBirth: draft.dob!,
      prematureWeeks,
      sex: normalizeSexForBaby(draft.sex),
    });
    clearDraft();
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Root' }] }),
    );
  };

  // Once auth completes (authedUser flips on this focused screen):
  //   1. If the user already has bebés in Supabase, this isn't a new
  //      registration — alert them, adopt the existing data, and skip
  //      creating the draft baby.
  //   2. Otherwise persist the draft baby + push any other local data
  //      (sessions/events that the user accumulated as a guest) up to
  //      the new account, then reset to Root.
  // Guarded with a ref so a re-focus doesn't double-write.
  useEffect(() => {
    if (!isFocused || !authedUser || finalizedRef.current) return;
    if (!draftIsComplete(draft)) return;
    finalizedRef.current = true;
    setAuthSheetOpen(false);
    (async () => {
      await upsertProfile(authedUser.id, {
        email: authedUser.email,
        displayName: authedUser.name,
        provider: authedUser.provider,
      });

      const existing = await listBabies(authedUser.id);
      if (existing.length > 0) {
        const enterExisting = (): void => {
          setBabies(existing);
          clearDraft();
          navigation.dispatch(
            CommonActions.reset({ index: 0, routes: [{ name: 'Root' }] }),
          );
        };
        Alert.alert(
          t('onboarding.summary.existingAccountTitle'),
          t('onboarding.summary.existingAccountBody'),
          [
            {
              text: t('onboarding.summary.existingAccountCta'),
              onPress: enterExisting,
            },
          ],
          { cancelable: false },
        );
        return;
      }

      const baby = await insertBabyFromDraft(authedUser.id, draft);
      if (baby) {
        addBabyWithId(baby);
      } else {
        const prematureWeeks =
          draft.atTerm === false
            ? computePrematureWeeks(draft.dob!, draft.dueDate)
            : undefined;
        addBaby({
          name: draft.name!.trim(),
          dateOfBirth: draft.dob!,
          prematureWeeks,
          sex: normalizeSexForBaby(draft.sex),
        });
      }
      await pushLocalToRemote(authedUser.id);
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
    setBabies,
    clearDraft,
  ]);

  const onApple = async () => {
    if (busy) return;
    setBusy(true);
    const result = await signInWithApple();
    setBusy(false);
    if (!result.ok && result.reason !== 'cancelled') {
      Alert.alert(
        t('onboarding.welcome.appleAlertTitle'),
        result.message ?? t('onboarding.welcome.googleErrorFallback'),
      );
    }
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

  const onFinalize = () => {
    haptics.light();
    setAuthSheetOpen(true);
  };

  return (
    <Screen backdrop="night" edges={['left', 'right']}>
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
          {t('onboarding.stepOf', { step: 6, total: TOTAL_STEPS })}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 160 + Math.max(insets.bottom, spacing.lg) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="eyebrow" tone="tertiary" style={styles.eyebrow}>
          {t('onboarding.summary.eyebrow')}
        </Text>
        <Text variant="title" align="center" style={styles.title}>
          {t('onboarding.summary.title')}
        </Text>
        <Text
          variant="callout"
          align="center"
          tone="secondary"
          style={styles.subtitle}
        >
          {t('onboarding.summary.subtitle', {
            name: draft.name?.trim() ?? '',
          })}
        </Text>

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
      </ScrollView>

      <View
        pointerEvents="box-none"
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) },
        ]}
      >
        <OrbitShine>
          <Button
            title={t('onboarding.finalize.cta')}
            onPress={onFinalize}
            disabled={!draftIsComplete(draft)}
          />
        </OrbitShine>
      </View>

      <Sheet visible={authSheetOpen} onClose={() => setAuthSheetOpen(false)}>
        <Text variant="title" align="center" style={styles.sheetTitle}>
          {t('onboarding.finalize.sheetTitle')}
        </Text>
        <Text
          variant="callout"
          tone="secondary"
          align="center"
          style={styles.sheetBody}
        >
          {t('onboarding.finalize.sheetBody')}
        </Text>
        {appleAvailable ? (
          <Pressable
            onPress={() => {
              haptics.light();
              void onApple();
            }}
            disabled={busy}
            style={({ pressed }) => [
              styles.authBtn,
              pressed && styles.authBtnPressed,
              busy && styles.authBtnDisabled,
            ]}
          >
            <Ionicons name="logo-apple" size={20} color="#000000" />
            <Text style={styles.authBtnLabel}>
              {t('onboarding.summary.apple')}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => {
            haptics.light();
            void onGoogle();
          }}
          disabled={busy}
          style={({ pressed }) => [
            styles.authBtn,
            pressed && styles.authBtnPressed,
            busy && styles.authBtnDisabled,
          ]}
        >
          <Ionicons name="logo-google" size={20} color="#000000" />
          <Text style={styles.authBtnLabel}>
            {t('onboarding.summary.google')}
          </Text>
        </Pressable>
      </Sheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
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
  scroll: {
    paddingHorizontal: screenGutter,
    paddingTop: spacing.md,
  },
  eyebrow: {
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  title: {
    paddingHorizontal: spacing.sm,
  },
  subtitle: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  summary: {
    marginBottom: spacing.lg,
  },
  disclaimer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  devSkip: {
    paddingVertical: spacing.md,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: screenGutter,
    paddingTop: spacing.lg,
    backgroundColor: 'rgba(7, 11, 31, 0.78)',
  },
  sheetTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sheetBody: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  authBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  authBtnPressed: {
    opacity: 0.85,
  },
  authBtnDisabled: {
    opacity: 0.5,
  },
  authBtnLabel: {
    color: '#0E0F12',
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  pressed: {
    opacity: 0.7,
  },
});
