import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NavigationContainerRef } from '@react-navigation/native';
import { Text } from '../Text';
import { colors, screenGutter, spacing } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

/** Maps route name → step index. Add new onboarding routes here. */
const STEP_FOR_ROUTE: Record<string, number> = {
  OnboardingDob: 1,
  OnboardingAtTerm: 2,
  OnboardingDueDate: 3,
  OnboardingIdentity: 4,
  OnboardingSex: 5,
  OnboardingSummary: 6,
};

const TOTAL = 6;
/** Reserved vertical space (excl. safe-area top inset) so screens
 *  can pad their content below the fixed header. */
export const ONBOARDING_HEADER_HEIGHT = 56;

interface OnboardingHeaderProps {
  routeName: string | undefined;
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>;
}

/**
 * Fixed header rendered as a sibling of the stack navigator so it
 * does NOT slide with the per-screen transitions. Only the step
 * number animates in/out (FadeIn/FadeOut keyed on step) when the
 * user moves between onboarding screens, giving a soft "the number
 * grew/shrank" feel without any layout jiggle.
 *
 * Renders nothing when the active route isn't an onboarding step.
 */
export const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({
  routeName,
  navigationRef,
}) => {
  const insets = useSafeAreaInsets();
  const step = routeName ? STEP_FOR_ROUTE[routeName] : undefined;
  if (!step) return null;

  const onBack = () => navigationRef.current?.goBack();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { paddingTop: insets.top + spacing.sm }]}
    >
      <Pressable
        onPress={onBack}
        hitSlop={12}
        style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text.primary} />
      </Pressable>
      <Animated.View
        key={step}
        entering={FadeIn.duration(260)}
        exiting={FadeOut.duration(180)}
      >
        <Text variant="footnote" tone="tertiary" style={styles.stepLabel}>
          {t('onboarding.stepOf', { step, total: TOTAL })}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: screenGutter,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
    elevation: 100,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.55,
  },
  stepLabel: {
    paddingRight: spacing.sm,
  },
});
