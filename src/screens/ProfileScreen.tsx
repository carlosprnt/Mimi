import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Screen,
  HeaderBar,
  Card,
  ListRow,
  SectionLabel,
  Text,
  Button,
} from '@/components';
import { colors, radii, spacing, screenGutter } from '@/theme';
import { useBabyStore, useActiveBaby } from '@/state/babyStore';
import { ageLabel } from '@/logic/age';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';
import {
  ProBadge,
  canAddBaby,
  canSwitchToBaby,
  useSubscription,
} from '@/subscription';

const IOS_SUBSCRIPTIONS_URL = 'itms-apps://apps.apple.com/account/subscriptions';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const baby = useActiveBaby();
  const babies = useBabyStore((s) => s.babies);
  const setActiveBaby = useBabyStore((s) => s.setActiveBaby);
  const preferences = useBabyStore((s) => s.preferences);
  const setPreferences = useBabyStore((s) => s.setPreferences);

  const {
    plan,
    isPro,
    openPaywall,
    restorePurchases,
    openManagement,
  } = useSubscription();

  const [restoreBusy, setRestoreBusy] = useState(false);
  const [restoreNote, setRestoreNote] = useState<string | null>(null);

  if (!baby) return null;

  const handleAddBaby = () => {
    if (!canAddBaby(babies.length, plan)) {
      openPaywall('multipleBabies');
      return;
    }
    navigation.navigate('OnboardingName');
  };

  const handleSwitchBaby = (id: string) => {
    if (!canSwitchToBaby(id, baby.id, plan)) {
      openPaywall('multipleBabies');
      return;
    }
    setActiveBaby(id);
  };

  const handleRemindersToggle = (next: boolean) => {
    if (!isPro) {
      openPaywall('notifications');
      return;
    }
    setPreferences({ remindersEnabled: next });
  };

  const handleBedtimeToggle = (next: boolean) => {
    if (!isPro) {
      openPaywall('notifications');
      return;
    }
    setPreferences({ bedtimeReminder: next });
  };

  const handleRestore = async () => {
    setRestoreBusy(true);
    setRestoreNote(null);
    try {
      const result = await restorePurchases();
      if (result === 'restored') setRestoreNote(t('pro.restoreSuccess'));
      else setRestoreNote(t('pro.restoreError'));
    } finally {
      setRestoreBusy(false);
    }
  };

  const handleManage = async () => {
    const url = await openManagement();
    Linking.openURL(url ?? IOS_SUBSCRIPTIONS_URL).catch(() => {});
  };

  const remindersValue = isPro && preferences.remindersEnabled;
  const bedtimeValue = isPro && preferences.bedtimeReminder;

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
        <SectionLabel label="MIMI PRO" />
        {isPro ? (
          <Card padded={false} style={styles.proCard}>
            <View style={styles.proInner}>
              <View style={styles.proHead}>
                <Text variant="headline" tone="primary">
                  {t('pro.activeTitle')}
                </Text>
                <ProBadge tone="solid" />
              </View>
              <Text variant="callout" tone="secondary" style={styles.proBody}>
                {t('pro.activeBody')}
              </Text>
              <View style={styles.proActions}>
                <Button title={t('pro.manage')} onPress={handleManage} variant="subtle" />
                <View style={{ height: spacing.sm }} />
                <Button
                  title={t('pro.restore')}
                  onPress={handleRestore}
                  variant="ghost"
                  loading={restoreBusy}
                />
                {restoreNote ? (
                  <Text variant="footnote" tone="tertiary" align="center" style={styles.restoreNote}>
                    {restoreNote}
                  </Text>
                ) : null}
              </View>
            </View>
          </Card>
        ) : (
          <Pressable
            onPress={() => openPaywall('settings')}
            accessibilityRole="button"
            style={({ pressed }) => [pressed && styles.pressedCard]}
          >
            <Card padded={false} style={styles.proCard}>
              <View style={styles.proInner}>
                <View style={styles.proHead}>
                  <Text variant="headline" tone="primary">
                    {t('pro.settingsTitle')}
                  </Text>
                  <ProBadge />
                </View>
                <Text variant="callout" tone="secondary" style={styles.proBody}>
                  {t('pro.settingsBody')}
                </Text>
                <View style={styles.proActions}>
                  <Button title={t('pro.unlock')} onPress={() => openPaywall('settings')} />
                  <View style={{ height: spacing.sm }} />
                  <Button
                    title={t('pro.restore')}
                    onPress={handleRestore}
                    variant="ghost"
                    loading={restoreBusy}
                  />
                  {restoreNote ? (
                    <Text variant="footnote" tone="tertiary" align="center" style={styles.restoreNote}>
                      {restoreNote}
                    </Text>
                  ) : null}
                </View>
              </View>
            </Card>
          </Pressable>
        )}

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

        {babies.length > 1 ? (
          <>
            <SectionLabel label="ALL BABIES" />
            <Card padded={false}>
              <View style={styles.inner}>
                {babies.map((b, i) => {
                  const isLast = i === babies.length - 1;
                  const isActive = b.id === baby.id;
                  const accessible = canSwitchToBaby(b.id, baby.id, plan);
                  return (
                    <ListRow
                      key={b.id}
                      label={b.name}
                      caption={
                        isActive
                          ? 'Bebé activo'
                          : !accessible
                            ? t('pro.locked')
                            : 'Tocar para cambiar'
                      }
                      value={isActive ? '✓' : undefined}
                      onPress={isActive ? undefined : () => handleSwitchBaby(b.id)}
                      trailing={!isActive && !accessible ? <ProBadge /> : undefined}
                      showDivider={!isLast}
                    />
                  );
                })}
              </View>
            </Card>
          </>
        ) : null}

        <View style={styles.addBabyWrap}>
          <Button
            title="Añadir bebé"
            variant="subtle"
            onPress={handleAddBaby}
          />
          {!canAddBaby(babies.length, plan) ? (
            <Text variant="footnote" tone="tertiary" align="center" style={styles.addBabyHint}>
              {t('pro.locked')}
            </Text>
          ) : null}
        </View>

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
              caption={!isPro ? t('pro.locked') : undefined}
              trailing={
                <View style={styles.switchTrail}>
                  {!isPro ? <ProBadge /> : null}
                  <Switch
                    value={remindersValue}
                    onValueChange={handleRemindersToggle}
                    trackColor={{ false: colors.border.strong, true: colors.accent.base }}
                    thumbColor={colors.text.primary}
                    ios_backgroundColor={colors.border.strong}
                  />
                </View>
              }
            />
            <ListRow
              label="Bedtime reminder"
              caption={!isPro ? t('pro.locked') : undefined}
              trailing={
                <View style={styles.switchTrail}>
                  {!isPro ? <ProBadge /> : null}
                  <Switch
                    value={bedtimeValue}
                    onValueChange={handleBedtimeToggle}
                    trackColor={{ false: colors.border.strong, true: colors.accent.base }}
                    thumbColor={colors.text.primary}
                    ios_backgroundColor={colors.border.strong}
                  />
                </View>
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
  proCard: {
    borderRadius: radii.xl,
    backgroundColor: colors.bg.elevated,
  },
  proInner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  proHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  proBody: {
    marginBottom: spacing.lg,
  },
  proActions: {
    marginTop: spacing.sm,
  },
  restoreNote: {
    marginTop: spacing.sm,
  },
  pressedCard: {
    opacity: 0.85,
  },
  addBabyWrap: {
    marginTop: spacing.md,
  },
  addBabyHint: {
    marginTop: spacing.xs,
  },
  switchTrail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
