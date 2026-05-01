import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../Screen';
import { Text } from '../Text';
import { Button } from '../Button';
import { ONBOARDING_HEADER_HEIGHT } from './OnboardingHeader';
import { ONBOARDING_ENTER, ONBOARDING_EXIT } from './onboardingMotion';
import { screenGutter, spacing } from '@/theme';

interface OnboardingSceneProps {
  step: number;
  total: number;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Optional react node rendered between the header and the title.
   *  Used by step screens that show an illustration. */
  hero?: React.ReactNode;
  cta?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  secondaryCta?: {
    label: string;
    onPress: () => void;
  };
  children?: React.ReactNode;
  scrollable?: boolean;
}

export const OnboardingScene: React.FC<OnboardingSceneProps> = ({
  eyebrow,
  title,
  subtitle,
  hero,
  cta,
  secondaryCta,
  children,
  scrollable = false,
}) => {
  const insets = useSafeAreaInsets();
  const topPad = insets.top + ONBOARDING_HEADER_HEIGHT;

  const Body = scrollable ? ScrollView : View;
  const bodyProps = scrollable
    ? {
        contentContainerStyle: [styles.scrollContent, { paddingTop: topPad }],
        showsVerticalScrollIndicator: false,
        keyboardShouldPersistTaps: 'handled' as const,
      }
    : { style: [styles.body, { paddingTop: topPad }] };

  return (
    <Screen backdrop="night" edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <Animated.View
          style={styles.flex}
          entering={ONBOARDING_ENTER}
          exiting={ONBOARDING_EXIT}
        >
          <Body {...bodyProps}>
            {hero ? <View style={styles.hero}>{hero}</View> : null}
            {eyebrow ? (
              <Text variant="eyebrow" tone="tertiary" style={styles.eyebrow}>
                {eyebrow}
              </Text>
            ) : null}
            <Text variant="title" align="center" style={styles.title}>
              {title}
            </Text>
            {subtitle ? (
              <Text
                variant="callout"
                align="center"
                tone="secondary"
                style={styles.subtitle}
              >
                {subtitle}
              </Text>
            ) : null}
            {children ? <View style={styles.children}>{children}</View> : null}
          </Body>
        </Animated.View>

        {cta || secondaryCta ? (
          <View
            style={[
              styles.ctaWrap,
              { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            ]}
          >
            {cta ? (
              <Button
                title={cta.label}
                onPress={cta.onPress}
                disabled={cta.disabled}
                loading={cta.loading}
              />
            ) : null}
            {secondaryCta ? (
              <Pressable
                onPress={secondaryCta.onPress}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.secondary,
                  pressed && styles.secondaryPressed,
                ]}
              >
                <Text variant="footnote" tone="secondary">
                  {secondaryCta.label}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: {
    flex: 1,
    paddingHorizontal: screenGutter,
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: screenGutter,
    paddingBottom: spacing.lg,
    flexGrow: 1,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
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
  },
  children: {
    marginTop: spacing.xxl,
  },
  ctaWrap: {
    paddingHorizontal: screenGutter,
    paddingTop: spacing.md,
  },
  secondary: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  secondaryPressed: {
    opacity: 0.55,
  },
});
