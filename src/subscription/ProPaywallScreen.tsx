import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from '@/components';
import { colors, radii, spacing, screenGutter } from '@/theme';
import { t } from '@/i18n';
import { useSubscription } from './SubscriptionProvider';
import type { ProPaywallReason } from './types';

const BULLETS: { key: string; iconKey: 'multipleBabies' | 'fullHistory' | 'fullStats' | 'notifications' }[] = [
  { key: 'pro.paywall.bullet.multipleBabies', iconKey: 'multipleBabies' },
  { key: 'pro.paywall.bullet.fullHistory', iconKey: 'fullHistory' },
  { key: 'pro.paywall.bullet.fullStats', iconKey: 'fullStats' },
  { key: 'pro.paywall.bullet.notifications', iconKey: 'notifications' },
];

const ICONS: Record<string, string> = {
  multipleBabies: '◍',
  fullHistory: '◷',
  fullStats: '◐',
  notifications: '◌',
};

export const ProPaywallScreen: React.FC = () => {
  const {
    paywall,
    closePaywall,
    purchaseMonthly,
    purchaseYearly,
    restorePurchases,
    prices,
    error,
  } = useSubscription();

  const [busy, setBusy] = useState<'monthly' | 'yearly' | 'restore' | null>(null);
  const [restoreNote, setRestoreNote] = useState<string | null>(null);

  const reason: ProPaywallReason = paywall.reason;
  const reasonTitle = t(`pro.reason.${reason}.title`);
  const reasonBody = t(`pro.reason.${reason}.body`);

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
    try {
      const result = await restorePurchases();
      if (result === 'restored') {
        setRestoreNote(t('pro.restoreSuccess'));
      } else if (result === 'no-purchases') {
        setRestoreNote(t('pro.restoreError'));
      } else {
        setRestoreNote(t('pro.restoreError'));
      }
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
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <View style={styles.header}>
            <Pressable
              onPress={closePaywall}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t('pro.notNow')}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            >
              <Text variant="headline" tone="secondary">
                ✕
              </Text>
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
                    <Text variant="callout" tone="accent">
                      {ICONS[b.iconKey] ?? '•'}
                    </Text>
                  </View>
                  <Text variant="body" tone="primary" style={styles.bulletText}>
                    {t(b.key)}
                  </Text>
                </View>
              ))}
            </View>

            {error ? (
              <Text variant="footnote" tone="warn" align="center" style={styles.feedback}>
                {error}
              </Text>
            ) : null}

            {restoreNote ? (
              <Text variant="footnote" tone="secondary" align="center" style={styles.feedback}>
                {restoreNote}
              </Text>
            ) : null}
          </ScrollView>

          <View style={styles.actions}>
            <Button
              title={busy === 'monthly' ? t('pro.paywall.monthly') : monthlyLabel}
              onPress={handleMonthly}
              loading={busy === 'monthly'}
              disabled={busy !== null && busy !== 'monthly'}
            />
            <View style={{ height: spacing.sm }} />
            <Button
              title={busy === 'yearly' ? t('pro.paywall.yearly') : yearlyLabel}
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
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  safe: {
    flex: 1,
  },
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
    backgroundColor: colors.bg.elevated,
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
