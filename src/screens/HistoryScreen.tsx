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
  RangeBarChart,
  type RangeBar,
} from '@/components';
import { spacing, screenGutter, colors, fonts } from '@/theme';
import { useActiveBaby } from '@/state/babyStore';
import { useSessionsForBaby } from '@/state/sleepStore';
import { useCareEventsForBaby } from '@/state/careEventStore';
import { SleepSession } from '@/logic/recommendation';
import { CareEvent } from '@/logic/careEvents';
import { startOfDay } from '@/logic/format';
import { DrawerParamList } from '@/navigation/types';
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

/**
 * Night sleep duration attributed to the day it ENDS on. So "the night
 * before Tuesday" appears on the Tuesday bar.
 */
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

/**
 * For each day, find the night-wake care events that belong to "the
 * night before that day" (between 18:00 of the previous day and 12:00
 * of the day). Returns a range bar per day with min, max, mean of the
 * wake hour, normalised so 00:00 → 24, 03:00 → 27, etc — keeping the
 * y-axis monotonic across the night.
 */
const nightWakeRangesByDay = (
  events: CareEvent[],
  days: Date[],
): Array<RangeBar | null> => {
  // Pre-bin events by their day-key
  const wakesByDay = new Map<number, number[]>();
  for (const day of days) wakesByDay.set(dayKey(day), []);

  for (const ev of events) {
    if (ev.kind !== 'nightWake') continue;
    const at = new Date(ev.at);
    const h = at.getHours() + at.getMinutes() / 60;
    // If wake happened before noon, attribute to the same calendar day
    // (it belongs to that day's night which started yesterday). Map
    // those hours to 24+h so the bar plots above the night start.
    // If wake happened in the evening (>= 18), it belongs to TOMORROW's
    // day bar (the night that ends tomorrow).
    let attributedDayMs: number;
    let normH: number;
    if (h < 12) {
      attributedDayMs = dayKey(at);
      normH = h + 24;
    } else if (h >= 18) {
      const tomorrow = new Date(at);
      tomorrow.setDate(tomorrow.getDate() + 1);
      attributedDayMs = dayKey(tomorrow);
      normH = h;
    } else {
      // Daytime wake — not part of the night.
      continue;
    }
    const arr = wakesByDay.get(attributedDayMs);
    if (!arr) continue;
    arr.push(normH);
  }

  return days.map((d) => {
    const arr = wakesByDay.get(dayKey(d)) ?? [];
    if (arr.length === 0) return null;
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return { min, max, mean };
  });
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

const formatNormHour = (h: number): string => {
  const real = h % 24;
  const hh = Math.floor(real);
  const mm = Math.round((real - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

const sumAvg = (xs: number[]): number => {
  const filtered = xs.filter((x) => x > 0);
  if (filtered.length === 0) return 0;
  return filtered.reduce((acc, x) => acc + x, 0) / filtered.length;
};

const meanOfMeans = (
  ranges: Array<RangeBar | null>,
): number | null => {
  const means = ranges
    .filter((r): r is RangeBar => r !== null && r.mean !== undefined)
    .map((r) => r.mean!);
  if (means.length === 0) return null;
  return means.reduce((a, b) => a + b, 0) / means.length;
};

export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList, 'History'>>();
  const baby = useActiveBaby();
  const sessions = useSessionsForBaby(baby?.id ?? null);
  const careEvents = useCareEventsForBaby(baby?.id ?? null);
  const [range, setRange] = useState<Range>('week');

  const days = useMemo(() => buildDays(range, new Date()), [range]);
  const nightSleepValues = useMemo(
    () => nightSleepMsByDay(sessions, days),
    [sessions, days],
  );
  const wakeRanges = useMemo(
    () => nightWakeRangesByDay(careEvents, days),
    [careEvents, days],
  );

  const avgNightMs = sumAvg(nightSleepValues);
  const avgWakeHour = meanOfMeans(wakeRanges);

  const labels = days.map(range === 'week' ? dayLabelWeek : dayLabelMonth);
  const isMonth = range === 'month';
  const monthCellWidth = 28;

  // Y axis for the night-wake-hours chart: 18:00 → 30:00 (06:00 next).
  const Y_MIN = 18;
  const Y_MAX = 30;

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
              {t('history.nightSleepDaily')}
            </Text>
            <Text variant="footnote" tone="secondary">
              {t('history.average')} · {formatSleepHours(avgNightMs)}
            </Text>
          </View>
          {isMonth ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <BarChart
                values={nightSleepValues}
                labels={labels}
                tint={colors.accent.base}
                cellWidth={monthCellWidth}
              />
            </ScrollView>
          ) : (
            <BarChart
              values={nightSleepValues}
              labels={labels}
              tint={colors.accent.base}
              formatValue={formatSleepHours}
            />
          )}
        </Card>

        <Card variant="bordered" tone="night" style={styles.card}>
          <View style={styles.cardHead}>
            <Text variant="eyebrow" tone="tertiary">
              {t('history.nightWakeHours')}
            </Text>
            <Text variant="footnote" tone="secondary">
              {avgWakeHour !== null
                ? `${t('history.average')} · ${formatNormHour(avgWakeHour)}`
                : '—'}
            </Text>
          </View>
          {isMonth ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <RangeBarChart
                ranges={wakeRanges}
                labels={labels}
                yMin={Y_MIN}
                yMax={Y_MAX}
                tint={colors.danger.base}
                formatTick={(y) => formatNormHour(y)}
                cellWidth={monthCellWidth}
              />
            </ScrollView>
          ) : (
            <RangeBarChart
              ranges={wakeRanges}
              labels={labels}
              yMin={Y_MIN}
              yMax={Y_MAX}
              tint={colors.danger.base}
              formatTick={(y) => formatNormHour(y)}
            />
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
