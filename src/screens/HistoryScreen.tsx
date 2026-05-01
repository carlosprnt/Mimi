import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Screen,
  HeaderBar,
  Card,
  Text,
  BarChart,
  NightWakeBarChart,
  MoodChart,
  type NightWakeBar,
  type Mood,
} from '@/components';
import { spacing, screenGutter, colors, fonts } from '@/theme';
import { useActiveBaby } from '@/state/babyStore';
import { useSessionsForBaby } from '@/state/sleepStore';
import { useCareEventsForBaby } from '@/state/careEventStore';
import { SleepSession } from '@/logic/recommendation';
import { CareEvent } from '@/logic/careEvents';
import { startOfDay } from '@/logic/format';
import { haptics } from '@/logic/haptics';
import { MainStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

type Range = 'week' | 'month';

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

/** Night sleep duration attributed to the day it ENDS on. */
const nightSleepMsByDay = (
  sessions: SleepSession[],
  days: Date[],
): number[] => {
  const buckets = new Map<number, number>();
  for (const day of days) buckets.set(dayKey(day), 0);
  for (const s of sessions) {
    if (!s.endedAt || s.kind !== 'night') continue;
    const ended = new Date(s.endedAt);
    const key = dayKey(ended);
    if (!buckets.has(key)) continue;
    const ms =
      new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime();
    buckets.set(key, (buckets.get(key) ?? 0) + ms);
  }
  return days.map((d) => buckets.get(dayKey(d)) ?? 0);
};

/** Total nap duration per calendar day. */
const napMsByDay = (
  sessions: SleepSession[],
  days: Date[],
): number[] => {
  const buckets = new Map<number, number>();
  for (const day of days) buckets.set(dayKey(day), 0);
  for (const s of sessions) {
    if (!s.endedAt || s.kind === 'night') continue;
    const started = new Date(s.startedAt);
    const key = dayKey(started);
    if (!buckets.has(key)) continue;
    const ms =
      new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime();
    buckets.set(key, (buckets.get(key) ?? 0) + ms);
  }
  return days.map((d) => buckets.get(dayKey(d)) ?? 0);
};

/**
 * Attribute a nightWake event to a "night-day". Wakes before noon
 * belong to the same calendar day; wakes after 18:00 belong to the
 * NEXT day's night chart. Daytime wakes (12-18) are skipped.
 */
const attributeNightWake = (at: Date): number | null => {
  const h = at.getHours() + at.getMinutes() / 60;
  if (h < 12) return dayKey(at);
  if (h >= 18) {
    const next = new Date(at);
    next.setDate(next.getDate() + 1);
    return dayKey(next);
  }
  return null;
};

/** Count of nightWake care events per night-day. */
const nightWakesByDay = (
  events: CareEvent[],
  days: Date[],
): number[] => {
  const buckets = new Map<number, number>();
  for (const day of days) buckets.set(dayKey(day), 0);
  for (const ev of events) {
    if (ev.kind !== 'nightWake') continue;
    const at = new Date(ev.at);
    const key = attributeNightWake(at);
    if (key === null || !buckets.has(key)) continue;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return days.map((d) => buckets.get(dayKey(d)) ?? 0);
};

/**
 * For each day, compute the night's start/end time and map wake events
 * to their relative position (0..1) within that span.
 */
const nightWakeBars = (
  sessions: SleepSession[],
  events: CareEvent[],
  days: Date[],
): NightWakeBar[] => {
  type Span = { start: number; end: number; sleepMs: number };
  const spans = new Map<number, Span>();
  for (const day of days) spans.set(dayKey(day), { start: 0, end: 0, sleepMs: 0 });
  for (const s of sessions) {
    if (!s.endedAt || s.kind !== 'night') continue;
    const startedAt = new Date(s.startedAt).getTime();
    const endedAt = new Date(s.endedAt).getTime();
    const key = dayKey(new Date(s.endedAt));
    const span = spans.get(key);
    if (!span) continue;
    span.start = span.start === 0 ? startedAt : Math.min(span.start, startedAt);
    span.end = Math.max(span.end, endedAt);
    span.sleepMs += endedAt - startedAt;
  }

  // Map wake events into the night's span.
  const wakesByKey = new Map<number, number[]>();
  for (const ev of events) {
    if (ev.kind !== 'nightWake') continue;
    const at = new Date(ev.at);
    const key = attributeNightWake(at);
    if (key === null) continue;
    const span = spans.get(key);
    if (!span || span.end <= span.start) continue;
    const t = at.getTime();
    const rel = (t - span.start) / (span.end - span.start);
    if (rel < 0 || rel > 1) continue;
    const list = wakesByKey.get(key) ?? [];
    list.push(rel);
    wakesByKey.set(key, list);
  }

  return days.map((d) => {
    const k = dayKey(d);
    const span = spans.get(k);
    return {
      sleepMs: span?.sleepMs ?? 0,
      wakes: wakesByKey.get(k) ?? [],
    };
  });
};

/**
 * Heuristic mood per day:
 *  - 'great' if sleep ≥ 9h and 0 night wakes
 *  - 'good'  if 1-2 wakes (or sleep ≥ 7h with 0 wakes)
 *  - 'rough' if 3+ wakes
 *  - 'none'  if no sleep recorded
 */
const moodByDay = (
  nightMs: number[],
  wakes: number[],
): Mood[] => {
  return nightMs.map((ms, i) => {
    if (ms <= 0) return 'none';
    const w = wakes[i] ?? 0;
    const hours = ms / 3600000;
    if (w === 0 && hours >= 9) return 'great';
    if (w >= 3) return 'rough';
    return 'good';
  });
};

const dayLabelWeek = (d: Date): string =>
  d.toLocaleDateString(undefined, { weekday: 'narrow' }).toUpperCase();

const dayLabelMonth = (d: Date): string => String(d.getDate());

const formatSleepHours = (ms: number): string => {
  if (ms <= 0) return '';
  const hours = Math.round((ms / 3600000) * 10) / 10;
  return `${hours}h`;
};

const sumAvg = (xs: number[]): number => {
  const filtered = xs.filter((x) => x > 0);
  if (filtered.length === 0) return 0;
  return filtered.reduce((acc, x) => acc + x, 0) / filtered.length;
};

const meanAll = (xs: number[]): number =>
  xs.length === 0 ? 0 : xs.reduce((acc, x) => acc + x, 0) / xs.length;

export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList, 'History'>>();
  const baby = useActiveBaby();
  const sessions = useSessionsForBaby(baby?.id ?? null);
  const careEvents = useCareEventsForBaby(baby?.id ?? null);
  const [range, setRange] = useState<Range>('week');

  const days = useMemo(() => buildDays(range, new Date()), [range]);
  const nightSleepValues = useMemo(
    () => nightSleepMsByDay(sessions, days),
    [sessions, days],
  );
  const napValues = useMemo(
    () => napMsByDay(sessions, days),
    [sessions, days],
  );
  const wakeCounts = useMemo(
    () => nightWakesByDay(careEvents, days),
    [careEvents, days],
  );
  const wakeBars = useMemo(
    () => nightWakeBars(sessions, careEvents, days),
    [sessions, careEvents, days],
  );
  const moods = useMemo(
    () => moodByDay(nightSleepValues, wakeCounts),
    [nightSleepValues, wakeCounts],
  );

  const avgNightMs = sumAvg(nightSleepValues);
  const avgNapMs = sumAvg(napValues);
  const avgWakeCount = meanAll(wakeCounts);

  const labels = days.map(range === 'week' ? dayLabelWeek : dayLabelMonth);

  const isMonth = range === 'month';
  const monthCellWidth = 28;

  return (
    <Screen backdrop="night">
      <HeaderBar
        title={t('history.title')}
        leading={{
          icon: 'arrow-back',
          label: t('common.back'),
          onPress: () => navigation.goBack(),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.toggle}>
          <Pressable
            onPress={() => {
              haptics.selection();
              setRange('week');
            }}
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
            onPress={() => {
              haptics.selection();
              setRange('month');
            }}
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
              {t('history.nightSleepDaily')}
            </Text>
            <Text tone="secondary" style={styles.cardAverage}>
              {t('history.average')} · {formatSleepHours(avgNightMs)}
            </Text>
          </View>
          {isMonth ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                values={nightSleepValues}
                labels={labels}
                tint={colors.accent.base}
                cellWidth={monthCellWidth}
                meanValue={avgNightMs}
              />
            </ScrollView>
          ) : (
            <BarChart
              values={nightSleepValues}
              labels={labels}
              tint={colors.accent.base}
              formatValue={formatSleepHours}
              meanValue={avgNightMs}
            />
          )}
        </Card>

        <Card variant="bordered" tone="night" style={styles.card}>
          <View style={styles.cardHead}>
            <Text variant="eyebrow" tone="tertiary">
              {t('history.nightWithWakes')}
            </Text>
            <Text tone="secondary" style={styles.cardAverage}>
              {t('history.average')} · {avgWakeCount.toFixed(1)}
            </Text>
          </View>
          {isMonth ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <NightWakeBarChart
                bars={wakeBars}
                labels={labels}
                cellWidth={monthCellWidth}
              />
            </ScrollView>
          ) : (
            <NightWakeBarChart bars={wakeBars} labels={labels} />
          )}
        </Card>

        <Card variant="bordered" tone="night" style={styles.card}>
          <View style={styles.cardHead}>
            <Text variant="eyebrow" tone="tertiary">
              {t('history.napsDaily')}
            </Text>
            <Text tone="secondary" style={styles.cardAverage}>
              {t('history.average')} · {formatSleepHours(avgNapMs)}
            </Text>
          </View>
          {isMonth ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                values={napValues}
                labels={labels}
                tint={colors.warn.soft}
                cellWidth={monthCellWidth}
                meanValue={avgNapMs}
              />
            </ScrollView>
          ) : (
            <BarChart
              values={napValues}
              labels={labels}
              tint={colors.warn.soft}
              formatValue={formatSleepHours}
              meanValue={avgNapMs}
            />
          )}
        </Card>

        <Card variant="bordered" tone="night" style={styles.card}>
          <View style={styles.cardHead}>
            <Text variant="eyebrow" tone="tertiary">
              {t('history.moodTitle')}
            </Text>
            <Text tone="secondary" style={styles.cardAverage}>
              {t('history.moodHint')}
            </Text>
          </View>
          {isMonth ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <MoodChart
                moods={moods}
                labels={labels}
                cellWidth={monthCellWidth}
              />
            </ScrollView>
          ) : (
            <MoodChart moods={moods} labels={labels} />
          )}
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
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  cardAverage: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 20,
  },
  empty: {
    paddingTop: spacing.lg,
  },
  emptyHint: {
    marginTop: spacing.xs,
  },
});
