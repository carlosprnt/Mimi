import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../Screen';
import { Text } from '../Text';
import { Button } from '../Button';
import { colors, screenGutter, spacing } from '@/theme';
import { ProgressDots } from './ProgressDots';
import { IllustrationStage } from './IllustrationStage';

interface OnboardingSceneProps {
  step: number;
  total: number;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  cta?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  children?: React.ReactNode;
  illustrationSex?: 'girl' | 'boy';
  scrollable?: boolean;
}

export const OnboardingScene: React.FC<OnboardingSceneProps> = ({
  step,
  total,
  eyebrow,
  title,
  subtitle,
  onBack,
  cta,
  children,
  illustrationSex,
  scrollable = false,
}) => {
  const insets = useSafeAreaInsets();

  const Body = scrollable ? ScrollView : View;
  const bodyProps = scrollable
    ? {
        contentContainerStyle: styles.scrollContent,
        showsVerticalScrollIndicator: false,
        keyboardShouldPersistTaps: 'handled' as const,
      }
    : { style: styles.body };

  return (
    <Screen backdrop="night" edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View
          style={[
            styles.topBar,
            { paddingTop: insets.top + spacing.sm },
          ]}
        >
          {onBack ? (
            <Pressable
              onPress={onBack}
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
          ) : (
            <View style={styles.backBtn} />
          )}
          <ProgressDots total={total} current={step} />
        </View>

        <IllustrationStage step={step} total={total} sex={illustrationSex} />

        <Body {...bodyProps}>
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

        {cta ? (
          <View
            style={[
              styles.ctaWrap,
              { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            ]}
          >
            <Button
              title={cta.label}
              onPress={cta.onPress}
              disabled={cta.disabled}
              loading={cta.loading}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  pressed: {
    opacity: 0.5,
  },
  body: {
    flex: 1,
    paddingHorizontal: screenGutter,
    justifyContent: 'flex-start',
  },
  scrollContent: {
    paddingHorizontal: screenGutter,
    paddingBottom: spacing.lg,
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
});
