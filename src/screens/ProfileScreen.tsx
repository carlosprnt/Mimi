import React from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Screen,
  HeaderBar,
  Card,
  ListRow,
  SectionLabel,
  Text,
} from '@/components';
import { colors, spacing, screenGutter } from '@/theme';
import { useBabyStore } from '@/state/babyStore';
import { ageLabel } from '@/logic/age';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const baby = useBabyStore((s) => s.baby);
  const preferences = useBabyStore((s) => s.preferences);
  const setPreferences = useBabyStore((s) => s.setPreferences);

  if (!baby) return null;

  return (
    <Screen>
      <HeaderBar
        title={t('profile.title')}
        leading={{
          glyph: '‹',
          label: t('common.back'),
          onPress: () => navigation.goBack(),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel label={t('profile.baby')} />
        <Card padded={false}>
          <View style={styles.inner}>
            <ListRow label={t('profile.name')} value={baby.name} />
            <ListRow
              label={t('profile.dob')}
              value={new Date(baby.dateOfBirth).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              caption={ageLabel(baby)}
            />
            <ListRow
              label={t('profile.bornEarly')}
              value={
                baby.prematureWeeks
                  ? t('profile.weeks', { count: baby.prematureWeeks })
                  : t('common.no')
              }
              showDivider={false}
            />
          </View>
        </Card>

        <SectionLabel label={t('profile.preferences')} />
        <Card padded={false}>
          <View style={styles.inner}>
            <ListRow
              label={t('profile.clock24h')}
              trailing={
                <Switch
                  value={preferences.use24h}
                  onValueChange={(v) => setPreferences({ use24h: v })}
                  trackColor={{ false: colors.border.strong, true: colors.accent.base }}
                  thumbColor={colors.text.primary}
                  ios_backgroundColor={colors.border.strong}
                />
              }
            />
            <ListRow
              label={t('profile.reminders')}
              trailing={
                <Switch
                  value={preferences.remindersEnabled}
                  onValueChange={(v) => setPreferences({ remindersEnabled: v })}
                  trackColor={{ false: colors.border.strong, true: colors.accent.base }}
                  thumbColor={colors.text.primary}
                  ios_backgroundColor={colors.border.strong}
                />
              }
            />
            <ListRow
              label={t('profile.bedtimeReminder')}
              trailing={
                <Switch
                  value={preferences.bedtimeReminder}
                  onValueChange={(v) => setPreferences({ bedtimeReminder: v })}
                  trackColor={{ false: colors.border.strong, true: colors.accent.base }}
                  thumbColor={colors.text.primary}
                  ios_backgroundColor={colors.border.strong}
                />
              }
              showDivider={false}
            />
          </View>
        </Card>

        <SectionLabel label={t('profile.about')} />
        <Card padded={false}>
          <View style={styles.inner}>
            <ListRow label={t('profile.version')} value="0.1.0" showDivider={false} />
          </View>
        </Card>

        <Text
          variant="footnote"
          tone="tertiary"
          align="center"
          style={styles.note}
        >
          {t('profile.disclaimer')}
        </Text>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: screenGutter,
    paddingBottom: spacing.huge,
  },
  inner: {
    paddingHorizontal: spacing.lg,
  },
  note: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
});
