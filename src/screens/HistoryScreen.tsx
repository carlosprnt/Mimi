import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import {
  Screen,
  HeaderBar,
  Card,
  Text,
  BarChart,
} from '@/components';
import { spacing, screenGutter, colors, fonts } from '@/theme';
import { useActiveBaby } from '@/state/babyStore';
import { useSessionsForBaby } from '@/state/sleepStore';
import { useCareEventsForBaby } from '@/state/careEventStore';
import { SleepSession } from '@/logic/recommendation';
import { CareEvent } from '@/logic/careEvents';
import { formatDuration, startOfDay } from '@/logic/format';
import { DrawerParamList } from '@/navigation/types';
import { t } from '@/i18n';

type Range = 'week' | 'month';

const DAY_MS = 24 * 60 * 60 * 1000;

const dayKey = (d: Date): number => startOfDay(d).getTime();

const buildDays = (range: Range, now: Date): Date[] => {
  const count = range === 'week' ? 7 : 30;
  const out: Date[] = [];
  const base = startOfDay(now);
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    out.push(d);
  }
  return out;
};

/**
 * Sleep duration attributed to a day = total ms of any session whose
 * end falls on that day (so a night that started yesterday and ended
 * this morning counts toward today). Naps count toward their end day.
 */
const sleepMsByDay = (
  sessions: SleepSession[],
  days: Date[],
): number[] => {
  const buckets = new Map<number, number>();
  for (const day of days) buckets.set(dayKey(day), 0);
  for (const s of sessions) {
    if (!s.endedAt) continue;
    const ended = new Date(s.endedAt);
    const key = dayKey(ended);
    if (!buckets.has(key)) continue;
    const ms =
      new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime();
    buckets.set(key, (buckets.get(key) ?? 0) + ms);
  }
  return days.map((d) => buckets.get(dayKey(d)) ?? 0);
};

/**
 * Night-wake count per "night" attributed to the wake-up day. A night
 * wake at 03:00 on day D belongs to day D's chart bar.
 */
const nightWakesByDay = (
  events: CareEvent[],
  days: Date[],
): number[] => {
  const buckets = new Map<number, number>();
  for (const day of days) buckets.set(dayKey(day), 0);
  for (const ev of events) {
    if (ev.kind !== 'nightWake') continue;
    const at = new Date(ev.at);
    const key = dayKey(at);
    if (!buckets.has(key)) continue;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return days.map((d) => buckets.get(dayKey(d)) ?? 0);
};

const dayLabelWeek = (d: Date): string =>
  d
    .toLocaleDateString(undefined, { weekday: 'narrow' })
    .toUpperCase();

const dayLabelMonth = (d: Date): string => String(d.getDate());

const formatSleepHours = (ms: number): string => {
  if (ms <= 0) return '';
  const hours = Math.round((ms / 3600000) * 10) / 10;
  return `${hours}h`;
};

const sumAvg = (xs: number[]): number => {
  const total = xs.reduce((acc, x) => acc + x, 0);
  return xs.length === 0 ? 0 : total / xs.length;
};

export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList, 'History'>>();
  const baby = useActiveBaby();
  const sessions = useSessionsForBaby(baby?.id ?? null);
  const careEvents = useCareEventsForBaby(baby?.id ?? null);
  const [range, setRange] = useState<Range>('week');

  const days = useMemo(() => buildDays(range, new Date()), [range]);
  const sleepValues = useMemo(
    () => sleepMsByDay(sessions, days),
    [sessions, days],
  );
  const wakeValues = useMemo(
    () => nightWakesByDay(careEvents, days),
    [careEvents, days],
  );

  const avgSleepMs = sumAvg(sleepValues);
  const avgWakes = sumAvg(wakeValues);

  const labels = days.map(range === 'week' ? dayLabelWeek : dayLabelMonth);

  return (
    <Screen backdrop="night">
      <HeaderBar
        title={t('history.title')}
        leading={{
          icon: 'arrow-back',
          label: t('common.back'),
          onPress: () => navigation.navigate('Home'),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.toggle}>
          <Pressable
            onPress={() => setRange('week')}
            style={({ pressed }) => [
              styles.toggleBtn,
              range === 'week' && styles.toggleBtnActive,
              pressed && styles.toggleBtnPressed,
            ]}
          >
            <Text
              variant="footnote"
              tone={range === 'week' ? 'primary' : 'tertiary'}
              style={styles.toggleLabel}
            >
              {t('history.week')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setRange('month')}
            style={({ pressed }) => [
              styles.toggleBtn,
              range === 'month' && styles.toggleBtnActive,
              pressed && styles.toggleBtnPressed,
            ]}
          >
            <Text
              variant="footnote"
              tone={range === 'month' ? 'primary' : 'tertiary'}
              style={styles.toggleLabel}
            >
              {t('history.month')}
            </Text>
          </Pressable>
        </View>

        <Card variant="bordered" tone="night" style={styles.card}>
          <View style={styles.cardHead}>
            <Text variant="eyebrow" tone="tertiary">
              {t('history.totalSleep')}
            </Text>
            <Text variant="footnote" tone="secondary">
              {t('history.average')} · {formatSleepHours(avgSleepMs)}
            </Text>
          </View>
          <BarChart
            values={sleepValues}
            labels={labels}
            tint={colors.accent.base}
            formatValue={range === 'week' ? formatSleepHours : undefined}
          />
        </Card>

        <Card variant="bordered" tone="night" style={styles.card}>
          <View style={styles.cardHead}>
            <Text variant="eyebrow" tone="tertiary">
              {t('history.nightWakes')}
            </Text>
            <Text variant="footnote" tone="secondary">
              {t('history.average')} · {avgWakes.toFixed(1)}
            </Text>
          </View>
          <BarChart
            values={wakeValues}
            labels={labels}
            tint={colors.danger.base}
            formatValue={
              range === 'week'
                ? (n) => (n > 0 ? String(n) : '')
                : undefined
            }
          />
        </Card>

        {sessions.filter((s) => s.endedAt).length === 0 ? (
          <View style={styles.empty}>
            <Text variant="callout" tone="tertiary" align="center">
              {t('history.empty')}
            </Text>
            <Text
              variant="footnote"
              tone="tertiary"
              align="center"
              style={styles.emptyHint}
            >
              {t('history.emptyHint')}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: screenGutter,
    paddingBottom: spacing.huge,
    gap: spacing.lg,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    padding: 4,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  toggleBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: 999,
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(168, 165, 230, 0.16)',
  },
  toggleBtnPressed: {
    opacity: 0.7,
  },
  toggleLabel: {
    fontFamily: fonts.medium,
  },
  card: {},
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  empty: {
    paddingTop: spacing.lg,
  },
  emptyHint: {
    marginTop: spacing.xs,
  },
});
