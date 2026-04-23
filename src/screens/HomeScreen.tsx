import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { useBabyStore } from '@/state/babyStore';
import { useSleepStore } from '@/state/sleepStore';
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
import { RootStackParamList } from '@/navigation/types';

const TICK_MS = 30 * 1000;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const baby = useBabyStore((s) => s.baby);
  const use24h = useBabyStore((s) => s.preferences.use24h);
  const sessions = useSleepStore((s) => s.sessions);
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
      startSleep();
    }
  };

  const confirmEndSleep = () => {
    endSleep();
    setConfirmEnd(false);
    softImpact();
  };

  return (
    <Screen>
      <HeaderBar
        showWordmark
        subtitle={`${baby.name} · ${ageLabel(baby, now)}`}
        leading={{
          glyph: '☰',
          label: 'Profile',
          onPress: () => navigation.navigate('Profile'),
        }}
        trailing={[
          {
            glyph: '◷',
            label: 'History',
            onPress: () => navigation.navigate('History'),
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <HeroCard
          eyebrow={recommendation.eyebrow}
          primary={recommendation.primary}
          supporting={recommendation.supporting}
          muted={recommendation.state === 'sleeping'}
        />

        <Card style={styles.todayCard}>
          <Text variant="eyebrow" tone="tertiary" style={styles.todayHeading}>
            TODAY
          </Text>
          <ListRow
            label="Total sleep"
            value={totalMs > 0 ? formatDuration(totalMs) : '—'}
          />
          <ListRow label="Naps" value={naps.toString()} />
          <ListRow
            label="Last sleep"
            value={lastValue}
            caption={lastCaption}
          />
          <ListRow
            label="Last wake window"
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
            Started at {formatClock(new Date(active.startedAt), use24h)}
          </Text>
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <StickyAction
        title={active ? 'End sleep' : 'Start sleep'}
        onPress={onPressAction}
        variant={active ? 'subtle' : 'primary'}
      />

      <Sheet visible={confirmEnd} onClose={() => setConfirmEnd(false)}>
        <Text variant="title" style={styles.sheetTitle}>
          End this sleep?
        </Text>
        <Text variant="callout" tone="secondary" style={styles.sheetBody}>
          Mimi will log the duration and update today.
        </Text>
        <View style={styles.sheetActions}>
          <Button title="Confirm" onPress={confirmEndSleep} />
          <View style={{ height: spacing.md }} />
          <Button
            title="Not yet"
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
