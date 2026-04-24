import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Text, Button } from '@/components';
import { spacing, screenGutter } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Screen>
      <View style={styles.body}>
        <Text variant="wordmark" align="center" tone="primary" style={styles.wordmark}>
          MIMI
        </Text>

        <Text variant="title" align="center" style={styles.title}>
          {t('onboarding.welcome.title')}
        </Text>

        <Text variant="callout" align="center" tone="secondary" style={styles.sub}>
          {t('onboarding.welcome.subtitle')}
        </Text>
      </View>

      <View style={styles.cta}>
        <Button
          title={t('onboarding.welcome.cta')}
          onPress={() => navigation.navigate('OnboardingName')}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: screenGutter,
    justifyContent: 'center',
  },
  wordmark: {
    marginBottom: spacing.xxxl,
  },
  title: {
    marginBottom: spacing.lg,
  },
  sub: {
    paddingHorizontal: spacing.md,
  },
  cta: {
    paddingHorizontal: screenGutter,
    paddingBottom: spacing.xl,
  },
});
