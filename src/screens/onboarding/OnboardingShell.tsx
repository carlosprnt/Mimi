import React, { useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Button, HeaderBar, OrbitShine } from '@/components';
import { haptics } from '@/logic/haptics';
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
  /** Header close (X) — exits the whole flow. */
  onClose?: () => void;
  /** Round back button next to the CTA — pops one step. */
  onPrevStep?: () => void;
  /** Wraps the CTA in a pulsing white halo (used on the final step). */
  ctaGlow?: boolean;
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
  onClose,
  onPrevStep,
  ctaGlow,
  secondaryTitle,
  onSecondary,
}) => {
  const resolvedCta = ctaTitle ?? t('common.continue');
  const resolvedTitle = title ?? t('onboarding.newBabyTitle');

  const glow = useSharedValue(0);
  useEffect(() => {
    if (!ctaGlow) return;
    glow.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(0, {
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      -1,
      false,
    );
  }, [ctaGlow, glow]);

  const glowStyle = useAnimatedStyle(() => ({
    // Thin, subtle white halo — the natural shadow gradient fades from
    // the button edge outward. Kept faint so the orbit shine reads as
    // the primary effect.
    shadowColor: '#FFFFFF',
    shadowOpacity: interpolate(glow.value, [0, 1], [0.04, 0.16]),
    shadowRadius: interpolate(glow.value, [0, 1], [2, 6]),
    shadowOffset: { width: 0, height: 0 },
    elevation: interpolate(glow.value, [0, 1], [1, 2]),
  }));
  return (
    <Screen backdrop="night">
      <HeaderBar
        title={resolvedTitle}
        leading={
          onClose
            ? {
                icon: 'close',
                label: t('common.close'),
                onPress: () => {
                  haptics.light();
                  onClose();
                },
              }
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
          <View style={styles.ctaRow}>
            {onPrevStep ? (
              <Pressable
                onPress={() => {
                  haptics.light();
                  onPrevStep();
                }}
                accessibilityRole="button"
                accessibilityLabel={t('common.back')}
                style={({ pressed }) => [
                  styles.prevBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="arrow-back"
                  size={22}
                  color={colors.text.primary}
                />
              </Pressable>
            ) : null}
            <Animated.View style={[styles.ctaFlex, ctaGlow && glowStyle]}>
              {ctaGlow ? (
                <OrbitShine>
                  <Button
                    title={resolvedCta}
                    onPress={() => {
                      haptics.medium();
                      onCta();
                    }}
                    disabled={ctaDisabled}
                  />
                </OrbitShine>
              ) : (
                <Button
                  title={resolvedCta}
                  onPress={() => {
                    haptics.light();
                    onCta();
                  }}
                  disabled={ctaDisabled}
                />
              )}
            </Animated.View>
          </View>
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
  ctaRow: {
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
  pressed: { opacity: 0.6 },
});
