import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen, Text, Button, HeaderBar } from '@/components';
import { spacing, screenGutter, colors } from '@/theme';
import { t } from '@/i18n';

interface OnboardingShellProps {
  step?: { index: number; total: number };
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  ctaTitle?: string;
  ctaDisabled?: boolean;
  onCta: () => void;
  onBack?: () => void;
  secondaryTitle?: string;
  onSecondary?: () => void;
}

export const OnboardingShell: React.FC<OnboardingShellProps> = ({
  step,
  eyebrow,
  title,
  subtitle,
  children,
  ctaTitle,
  ctaDisabled,
  onCta,
  onBack,
  secondaryTitle,
  onSecondary,
}) => {
  const resolvedCta = ctaTitle ?? t('common.continue');
  return (
    <Screen>
      <HeaderBar
        leading={
          onBack
            ? { glyph: '‹', label: t('common.back'), onPress: onBack }
            : undefined
        }
        subtitle={
          step
            ? t('onboarding.stepOf', { step: step.index, total: step.total })
            : undefined
        }
      />

      <View style={styles.body}>
        {eyebrow ? (
          <Text variant="eyebrow" tone="tertiary" style={styles.eyebrow}>
            {eyebrow}
          </Text>
        ) : null}
        <Text variant="title" style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="callout" tone="secondary" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}

        <View style={styles.content}>{children}</View>
      </View>

      <View style={styles.ctaWrap}>
        <Button title={resolvedCta} onPress={onCta} disabled={ctaDisabled} />
        {secondaryTitle && onSecondary ? (
          <>
            <View style={{ height: spacing.sm }} />
            <Button title={secondaryTitle} onPress={onSecondary} variant="dangerGhost" />
          </>
        ) : null}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: screenGutter,
    paddingTop: spacing.xl,
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
  content: {
    marginTop: spacing.xxl,
    flex: 1,
  },
  ctaWrap: {
    paddingHorizontal: screenGutter,
    paddingBottom: spacing.xl,
  },
});
