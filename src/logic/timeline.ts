import { Baby, ageInMonths } from './age';
import { startOfDay } from './format';
import {
  SleepSession,
  wakeWindowForAge,
  expectedNapsForAge,
  bedtimeHintForAge,
} from './recommendation';

export type TimelineKind = 'wake' | 'nap' | 'bedtime';
export type TimelineStatus = 'real' | 'active' | 'suggested';

export interface TimelineEvent {
  id: string;
  kind: TimelineKind;
  status: TimelineStatus;
  at?: Date;
  from?: Date;
  to?: Date;
  durationMs?: number;
}

const TYPICAL_NAP_MS = 60 * 60 * 1000;

const floatToDate = (day: Date, hoursFloat: number): Date => {
  const d = new Date(day);
  const h = Math.floor(hoursFloat);
  const m = Math.round((hoursFloat - h) * 60);
  d.setHours(h, m, 0, 0);
  return d;
};

export function buildTimeline(
  baby: Baby,
  sessions: SleepSession[],
  now: Date = new Date(),
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const today = startOfDay(now);
  const todayStartMs = today.getTime();

  const completed = sessions
    .filter((s) => s.endedAt)
    .sort(
      (a, b) =>
        new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    );

  const lastNightEndedToday = [...completed]
    .reverse()
    .find(
      (s) =>
        s.kind === 'night' &&
        s.endedAt &&
        new Date(s.endedAt).getTime() >= todayStartMs,
    );

  if (lastNightEndedToday) {
    events.push({
      id: `wake-${lastNightEndedToday.id}`,
      kind: 'wake',
      status: 'real',
      at: new Date(lastNightEndedToday.endedAt!),
    });
  }

  const todayNaps = completed.filter(
    (s) =>
      s.kind === 'nap' &&
      s.endedAt &&
      new Date(s.endedAt).getTime() >= todayStartMs,
  );
  for (const nap of todayNaps) {
    const start = new Date(nap.startedAt);
    const end = new Date(nap.endedAt!);
    events.push({
      id: `nap-${nap.id}`,
      kind: 'nap',
      status: 'real',
      from: start,
      to: end,
      durationMs: end.getTime() - start.getTime(),
    });
  }

  const active = sessions.find((s) => !s.endedAt);
  if (active) {
    events.push({
      id: `active-${active.id}`,
      kind: active.kind === 'night' ? 'bedtime' : 'nap',
      status: 'active',
      from: new Date(active.startedAt),
    });
  }

  const months = ageInMonths(baby, now);
  const wakeWin = wakeWindowForAge(months);
  const expectedNaps = expectedNapsForAge(months);
  const bedtime = bedtimeHintForAge(months);
  const bedtimeStart = floatToDate(today, bedtime.earliest);
  const bedtimeEnd = floatToDate(today, bedtime.latest);

  if (!active) {
    const lastKnownPoint =
      events.length > 0
        ? events[events.length - 1].to ?? events[events.length - 1].at ?? null
        : null;

    if (lastKnownPoint) {
      const remaining = Math.max(0, expectedNaps - todayNaps.length);
      let cursor = lastKnownPoint.getTime();
      for (let i = 0; i < remaining; i++) {
        const fromMs = cursor + wakeWin.minMs;
        const toMs = cursor + wakeWin.maxMs;
        if (fromMs >= bedtimeStart.getTime()) break;
        events.push({
          id: `suggested-nap-${i}`,
          kind: 'nap',
          status: 'suggested',
          from: new Date(fromMs),
          to: new Date(toMs),
        });
        cursor = toMs + TYPICAL_NAP_MS;
      }
    }
  }

  events.push({
    id: 'bedtime',
    kind: 'bedtime',
    status: active?.kind === 'night' ? 'active' : 'suggested',
    from: bedtimeStart,
    to: bedtimeEnd,
  });

  return events;
}
