import { Baby, ageInMonths } from './age';
import { isSameDay, startOfDay } from './format';
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
  sessionId?: string;
  at?: Date;
  from?: Date;
  to?: Date;
  durationMs?: number;
}

const TYPICAL_NAP_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

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
  day: Date = new Date(),
  now: Date = new Date(),
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const dayStart = startOfDay(day);
  const dayStartMs = dayStart.getTime();
  const dayEndMs = dayStartMs + DAY_MS;
  const isToday = isSameDay(day, now);

  const completed = sessions
    .filter((s) => s.endedAt)
    .sort(
      (a, b) =>
        new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    );

  const lastNightEndedThatDay = [...completed]
    .reverse()
    .find((s) => {
      if (s.kind !== 'night' || !s.endedAt) return false;
      const endMs = new Date(s.endedAt).getTime();
      return endMs >= dayStartMs && endMs < dayEndMs;
    });

  if (lastNightEndedThatDay) {
    events.push({
      id: `wake-${lastNightEndedThatDay.id}`,
      kind: 'wake',
      status: 'real',
      sessionId: lastNightEndedThatDay.id,
      at: new Date(lastNightEndedThatDay.endedAt!),
    });
  }

  const dayNaps = completed.filter((s) => {
    if (s.kind !== 'nap' || !s.endedAt) return false;
    const endMs = new Date(s.endedAt).getTime();
    return endMs >= dayStartMs && endMs < dayEndMs;
  });
  for (const nap of dayNaps) {
    const start = new Date(nap.startedAt);
    const end = new Date(nap.endedAt!);
    events.push({
      id: `nap-${nap.id}`,
      kind: 'nap',
      status: 'real',
      sessionId: nap.id,
      from: start,
      to: end,
      durationMs: end.getTime() - start.getTime(),
    });
  }

  const nightStartedThatDay = completed.find((s) => {
    if (s.kind !== 'night') return false;
    const startMs = new Date(s.startedAt).getTime();
    return startMs >= dayStartMs && startMs < dayEndMs;
  });

  const active = sessions.find((s) => !s.endedAt);

  if (isToday && active) {
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
  const bedtimeStart = floatToDate(dayStart, bedtime.earliest);
  const bedtimeEnd = floatToDate(dayStart, bedtime.latest);

  if (isToday && !active) {
    const lastKnownPoint =
      events.length > 0
        ? events[events.length - 1].to ?? events[events.length - 1].at ?? null
        : null;

    if (lastKnownPoint) {
      const remaining = Math.max(0, expectedNaps - dayNaps.length);
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

  if (nightStartedThatDay) {
    events.push({
      id: `bedtime-${nightStartedThatDay.id}`,
      kind: 'bedtime',
      status: 'real',
      sessionId: nightStartedThatDay.id,
      from: new Date(nightStartedThatDay.startedAt),
      to: new Date(nightStartedThatDay.endedAt!),
    });
  } else if (isToday) {
    events.push({
      id: 'bedtime',
      kind: 'bedtime',
      status: active?.kind === 'night' ? 'active' : 'suggested',
      from: bedtimeStart,
      to: bedtimeEnd,
    });
  }

  return events;
}
