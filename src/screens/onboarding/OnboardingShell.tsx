import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { Screen, Text, Button, HeaderBar } from '@/components';
import { spacing, screenGutter, colors } from '@/theme';
import { t } from '@/i18n';

interface OnboardingShellProps {
  step?: { index: number; total: number };
  /** Header title (defaults to "Nuevo bebé"). */
  title?: string;
  eyebrow?: string;
  /** In-body title shown above the children. */
  bodyTitle?: string;
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
  title,
  eyebrow,
  bodyTitle,
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
  const resolvedTitle = title ?? t('onboarding.newBabyTitle');
  return (
    <Screen backdrop="night">
      <HeaderBar
        title={resolvedTitle}
        leading={
          onBack
            ? { icon: 'arrow-back', label: t('common.back'), onPress: onBack }
            : undefined
        }
        trailingText={
          step
            ? t('onboarding.stepShort', { step: step.index, total: step.total })
            : undefined
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.body}>
          {eyebrow ? (
            <Text variant="eyebrow" tone="tertiary" style={styles.eyebrow}>
              {eyebrow}
            </Text>
          ) : null}
          {bodyTitle ? (
            <Text variant="title" style={styles.bodyTitle}>
              {bodyTitle}
            </Text>
          ) : null}
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
              <Button
                title={secondaryTitle}
                onPress={onSecondary}
                variant="dangerGhost"
              />
            </>
          ) : null}
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
    marginBottom: spacing.md,
  },
  bodyTitle: {
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
    paddingTop: spacing.md,
  },
});
