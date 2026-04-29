import { useEffect, useMemo } from 'react';
import { useActiveBaby } from '@/state/babyStore';
import { useSessionsForBaby } from '@/state/sleepStore';
import { Recommendation } from '@/logic/recommendation';
import { startOfDay } from '@/logic/format';
import { syncWidget } from '@/services/widgetSync';

const dayKey = (d: Date): number => startOfDay(d).getTime();

const buildLast7Days = (now: Date): Date[] => {
  const out: Date[] = [];
  const base = startOfDay(now);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    out.push(d);
  }
  return out;
};

const dayLabel = (d: Date): string =>
  d.toLocaleDateString(undefined, { weekday: 'narrow' }).toUpperCase();

/**
 * Subscribes to the relevant stores and pushes a snapshot to the iOS
 * Widget Extension's shared UserDefaults whenever something the
 * widget cares about changes.
 *
 * Mount once, near the root of the app (e.g. inside HomeScreen — that
 * already re-computes the recommendation each minute).
 */
export const useWidgetSync = (
  recommendation: Recommendation | null,
  now: Date,
): void => {
  const baby = useActiveBaby();
  const sessions = useSessionsForBaby(baby?.id ?? null);

  // Active session detection.
  const active = useMemo(
    () => sessions.find((s) => !s.endedAt) ?? null,
    [sessions],
  );

  // Weekly night sleep series (attributed to the day the session ends).
  const weekly = useMemo(() => {
    const days = buildLast7Days(now);
    const buckets = new Map<number, number>();
    for (const d of days) buckets.set(dayKey(d), 0);
    for (const s of sessions) {
      if (!s.endedAt || s.kind !== 'night') continue;
      const k = dayKey(new Date(s.endedAt));
      if (!buckets.has(k)) continue;
      const ms =
        new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime();
      buckets.set(k, (buckets.get(k) ?? 0) + ms);
    }
    const labels = days.map(dayLabel);
    const values = days.map((d) => buckets.get(dayKey(d)) ?? 0);
    const positive = values.filter((v) => v > 0);
    const avg =
      positive.length === 0
        ? 0
        : positive.reduce((a, b) => a + b, 0) / positive.length;
    return { labels, values, avg };
  }, [sessions, now]);

  useEffect(() => {
    void syncWidget({
      sleepStartedAt: active ? new Date(active.startedAt).toISOString() : null,
      sleepKind: active ? active.kind : null,
      nextActionKind:
        recommendation && recommendation.kind ? recommendation.kind : null,
      recommendationEyebrow: recommendation?.eyebrow ?? null,
      recommendationBody:
        recommendation?.primary ?? recommendation?.supporting ?? null,
      weekLabels: weekly.labels,
      weekNightMs: weekly.values,
      weekAverageMs: weekly.avg,
      babyName: baby?.name ?? null,
    });
  }, [
    active?.id,
    active?.startedAt,
    active?.kind,
    recommendation?.eyebrow,
    recommendation?.primary,
    recommendation?.supporting,
    recommendation?.kind,
    weekly.labels,
    weekly.values,
    weekly.avg,
    baby?.name,
  ]);
};
