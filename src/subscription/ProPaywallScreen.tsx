import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Text, Screen } from '@/components';
import { colors, radii, spacing, screenGutter } from '@/theme';
import { t } from '@/i18n';
import { useSubscription } from './SubscriptionProvider';
import type { ProPaywallReason } from './types';

const BULLETS: { key: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'pro.paywall.bullet.multipleBabies', icon: 'people-outline' },
  { key: 'pro.paywall.bullet.fullHistory', icon: 'time-outline' },
  { key: 'pro.paywall.bullet.fullStats', icon: 'pie-chart-outline' },
  { key: 'pro.paywall.bullet.notifications', icon: 'notifications-outline' },
];

export const ProPaywallScreen: React.FC = () => {
  const {
    paywall,
    closePaywall,
    purchaseMonthly,
    purchaseYearly,
    restorePurchases,
    prices,
  } = useSubscription();

  const [busy, setBusy] = useState<'monthly' | 'yearly' | 'restore' | null>(null);
  const [restoreNote, setRestoreNote] = useState<string | null>(null);
  const [errorNote, setErrorNote] = useState<string | null>(null);

  const reason: ProPaywallReason = paywall.reason;
  const reasonTitle = t(`pro.reason.${reason}.title` as never);
  const reasonBody = t(`pro.reason.${reason}.body` as never);

  const monthlyLabel = prices.monthly
    ? `${t('pro.paywall.monthly')} · ${prices.monthly}`
    : `${t('pro.paywall.monthly')} · ${t('pro.paywall.monthlyFallback')}`;
  const yearlyLabel = prices.yearly
    ? `${t('pro.paywall.yearly')} · ${prices.yearly}`
    : `${t('pro.paywall.yearly')} · ${t('pro.paywall.yearlyFallback')}`;

  const handleMonthly = async () => {
    if (busy) return;
    setBusy('monthly');
    setRestoreNote(null);
    setErrorNote(null);
    try {
      await purchaseMonthly();
    } finally {
      setBusy(null);
    }
  };

  const handleYearly = async () => {
    if (busy) return;
    setBusy('yearly');
    setRestoreNote(null);
    setErrorNote(null);
    try {
      await purchaseYearly();
    } finally {
      setBusy(null);
    }
  };

  const handleRestore = async () => {
    if (busy) return;
    setBusy('restore');
    setRestoreNote(null);
    setErrorNote(null);
    try {
      const result = await restorePurchases();
      if (result === 'restored') setRestoreNote(t('pro.restoreSuccess'));
      else setRestoreNote(t('pro.restoreError'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal
      visible={paywall.visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={closePaywall}
    >
      <Screen backdrop="night" edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable
            onPress={closePaywall}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('pro.notNow')}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
          >
            <Ionicons name="close" size={20} color={colors.text.secondary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="eyebrow" tone="accent" style={styles.eyebrow}>
            {t('pro.paywall.title').toUpperCase()}
          </Text>

          <Text variant="title" style={styles.reasonTitle}>
            {reasonTitle}
          </Text>

          <Text variant="callout" tone="secondary" style={styles.reasonBody}>
            {reasonBody}
          </Text>

          <View style={styles.bullets}>
            {BULLETS.map((b) => (
              <View key={b.key} style={styles.bulletRow}>
                <View style={styles.bulletIcon}>
                  <Ionicons name={b.icon} size={16} color={colors.accent.base} />
                </View>
                <Text variant="body" tone="primary" style={styles.bulletText}>
                  {t(b.key as never)}
                </Text>
              </View>
            ))}
          </View>

          {errorNote ? (
            <Text variant="footnote" tone="warn" align="center" style={styles.feedback}>
              {errorNote}
            </Text>
          ) : null}

          {restoreNote ? (
            <Text variant="footnote" tone="secondary" align="center" style={styles.feedback}>
              {restoreNote}
            </Text>
          ) : null}
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={styles.actions}>
          <Button
            title={monthlyLabel}
            onPress={handleMonthly}
            loading={busy === 'monthly'}
            disabled={busy !== null && busy !== 'monthly'}
          />
          <View style={{ height: spacing.sm }} />
          <Button
            title={yearlyLabel}
            onPress={handleYearly}
            variant="subtle"
            loading={busy === 'yearly'}
            disabled={busy !== null && busy !== 'yearly'}
          />
          <View style={{ height: spacing.sm }} />
          <Button
            title={t('pro.paywall.restore')}
            onPress={handleRestore}
            variant="ghost"
            loading={busy === 'restore'}
            disabled={busy !== null && busy !== 'restore'}
          />
          <Pressable
            onPress={closePaywall}
            accessibilityRole="button"
            style={({ pressed }) => [styles.notNow, pressed && styles.pressed]}
          >
            <Text variant="footnote" tone="tertiary" align="center">
              {t('pro.notNow')}
            </Text>
          </Pressable>
        </SafeAreaView>
      </Screen>
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    height: 48,
    alignItems: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: screenGutter,
    paddingBottom: spacing.xxl,
  },
  eyebrow: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  reasonTitle: {
    marginBottom: spacing.md,
  },
  reasonBody: {
    marginBottom: spacing.xxl,
  },
  bullets: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bulletIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.accent.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: {
    flex: 1,
  },
  feedback: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  actions: {
    paddingHorizontal: screenGutter,
    paddingBottom: spacing.lg,
  },
  notNow: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.6,
  },
});
