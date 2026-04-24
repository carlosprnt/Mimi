import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import {
  Screen,
  HeaderBar,
  HeroCard,
  Card,
  ListRow,
  Text,
  StickyAction,
  Sheet,
  Button,
} from '@/components';
import { spacing, screenGutter } from '@/theme';
import { useActiveBaby, useBabyStore } from '@/state/babyStore';
import { useSessionsForBaby, useSleepStore } from '@/state/sleepStore';
import {
  activeSession,
  computeRecommendation,
  lastCompletedSession,
  lastWakeWindowMs,
  napsCountToday,
  totalSleepTodayMs,
} from '@/logic/recommendation';
import { ageLabel } from '@/logic/age';
import {
  formatClock,
  formatDuration,
  formatRelativePast,
} from '@/logic/format';
import { softImpact, lightImpact } from '@/utils/haptics';
import { DrawerParamList } from '@/navigation/types';
import { t } from '@/i18n';

const TICK_MS = 30 * 1000;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList, 'Home'>>();
  const baby = useActiveBaby();
  const use24h = useBabyStore((s) => s.preferences.use24h);
  const sessions = useSessionsForBaby(baby?.id ?? null);
  const startSleep = useSleepStore((s) => s.startSleep);
  const endSleep = useSleepStore((s) => s.endSleep);

  const [now, setNow] = useState<Date>(() => new Date());
  const [confirmEnd, setConfirmEnd] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const recommendation = useMemo(
    () => (baby ? computeRecommendation(baby, sessions, now) : null),
    [baby, sessions, now],
  );

  const active = useMemo(() => activeSession(sessions), [sessions]);
  const last = useMemo(() => lastCompletedSession(sessions), [sessions]);

  if (!baby || !recommendation) return null;

  const totalMs = totalSleepTodayMs(sessions, now);
  const naps = napsCountToday(sessions, now);
  const wakeMs = lastWakeWindowMs(sessions, now);

  const lastCaption = last
    ? `ended ${formatRelativePast(now.getTime() - new Date(last.endedAt!).getTime())}`
    : undefined;

  const lastValue = last
    ? formatDuration(
        new Date(last.endedAt!).getTime() - new Date(last.startedAt).getTime(),
      )
    : '—';

  const onPressAction = () => {
    if (active) {
      lightImpact();
      setConfirmEnd(true);
    } else {
      softImpact();
      startSleep(baby.id);
    }
  };

  const confirmEndSleep = () => {
    endSleep(baby.id);
    setConfirmEnd(false);
    softImpact();
  };

  return (
    <Screen backdrop="night">
      <HeaderBar
        leading={{
          glyph: '☰',
          label: t('nav.menu'),
          onPress: () => navigation.dispatch(DrawerActions.openDrawer()),
        }}
        trailing={[
          {
            glyph: '◷',
            label: t('nav.history'),
            onPress: () => navigation.navigate('History'),
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.nameBlock}>
          <Text variant="display" tone="primary" style={styles.babyName}>
            {baby.name}
          </Text>
          <Text variant="callout" tone="secondary" style={styles.babyAge}>
            {ageLabel(baby, now)}
          </Text>
        </View>

        <HeroCard
          eyebrow={recommendation.eyebrow}
          primary={recommendation.primary}
          supporting={recommendation.supporting}
          muted={recommendation.state === 'sleeping'}
        />

        <Card variant="bordered" tone="night" style={styles.todayCard}>
          <Text variant="eyebrow" tone="tertiary" style={styles.todayHeading}>
            {t('home.today')}
          </Text>
          <ListRow
            label={t('home.totalSleep')}
            value={totalMs > 0 ? formatDuration(totalMs) : '—'}
          />
          <ListRow label={t('home.naps')} value={naps.toString()} />
          <ListRow
            label={t('home.lastSleep')}
            value={lastValue}
            caption={lastCaption}
          />
          <ListRow
            label={t('home.lastWakeWindow')}
            value={wakeMs !== null ? formatDuration(wakeMs) : '—'}
            showDivider={false}
          />
        </Card>

        {recommendation.context ? (
          <Text
            variant="callout"
            tone={recommendation.contextTone === 'warn' ? 'warn' : 'secondary'}
            align="center"
            style={styles.context}
          >
            {recommendation.context}
          </Text>
        ) : null}

        {active ? (
          <Text variant="footnote" tone="tertiary" align="center" style={styles.activeNote}>
            {t('home.startedAt', {
              time: formatClock(new Date(active.startedAt), use24h),
            })}
          </Text>
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <StickyAction
        title={active ? t('home.endSleep') : t('home.startSleep')}
        onPress={onPressAction}
        variant={active ? 'subtle' : 'primary'}
      />

      <Sheet visible={confirmEnd} onClose={() => setConfirmEnd(false)}>
        <Text variant="title" style={styles.sheetTitle}>
          {t('home.endConfirmTitle')}
        </Text>
        <Text variant="callout" tone="secondary" style={styles.sheetBody}>
          {t('home.endConfirmBody')}
        </Text>
        <View style={styles.sheetActions}>
          <Button title={t('common.confirm')} onPress={confirmEndSleep} />
          <View style={{ height: spacing.md }} />
          <Button
            title={t('common.notYet')}
            variant="ghost"
            onPress={() => setConfirmEnd(false)}
          />
        </View>
      </Sheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: screenGutter,
    paddingBottom: 120,
  },
  nameBlock: {
    marginTop: spacing.sm,
    marginBottom: spacing.base,
  },
  babyName: {
    // display variant already large; no extra sizing needed
  },
  babyAge: {
    marginTop: spacing.xs,
  },
  todayCard: {
    marginTop: spacing.xl,
    paddingVertical: spacing.base,
  },
  todayHeading: {
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xxs,
  },
  context: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.base,
  },
  activeNote: {
    marginTop: spacing.md,
  },
  bottomSpacer: {
    height: spacing.huge,
  },
  sheetTitle: {
    marginTop: spacing.sm,
  },
  sheetBody: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  sheetActions: {
    marginTop: spacing.md,
  },
});
