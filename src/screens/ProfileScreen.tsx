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

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const baby = useBabyStore((s) => s.baby);
  const preferences = useBabyStore((s) => s.preferences);
  const setPreferences = useBabyStore((s) => s.setPreferences);

  if (!baby) return null;

  return (
    <Screen>
      <HeaderBar
        title="Settings"
        leading={{
          glyph: '‹',
          label: 'Back',
          onPress: () => navigation.goBack(),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel label="BABY" />
        <Card padded={false}>
          <View style={styles.inner}>
            <ListRow label="Name" value={baby.name} />
            <ListRow
              label="Date of birth"
              value={new Date(baby.dateOfBirth).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              caption={ageLabel(baby)}
            />
            <ListRow
              label="Born early"
              value={
                baby.prematureWeeks
                  ? `${baby.prematureWeeks} weeks`
                  : 'No'
              }
              showDivider={false}
            />
          </View>
        </Card>

        <SectionLabel label="PREFERENCES" />
        <Card padded={false}>
          <View style={styles.inner}>
            <ListRow
              label="24-hour time"
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
              label="Reminders"
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
              label="Bedtime reminder"
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

        <SectionLabel label="ABOUT" />
        <Card padded={false}>
          <View style={styles.inner}>
            <ListRow label="Version" value="0.1.0" showDivider={false} />
          </View>
        </Card>

        <Text
          variant="footnote"
          tone="tertiary"
          align="center"
          style={styles.note}
        >
          Mimi offers gentle guidance — not medical advice.
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
