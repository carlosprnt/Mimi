import { Baby, ageInMonths } from './age';
import { startOfDay } from './format';
import { formatShortDuration } from './format';
import { t } from '@/i18n';

export type SleepKind = 'nap' | 'night';

export interface SleepSession {
  id: string;
  startedAt: string;
  endedAt: string | null;
  kind: SleepKind;
}

export interface WakeWindow {
  minMs: number;
  maxMs: number;
}

export interface Recommendation {
  state: 'sleeping' | 'countdown' | 'due' | 'overdue' | 'bedtime';
  eyebrow: string;
  primary: string;
  supporting?: string;
  context?: string;
  contextTone?: 'neutral' | 'warn';
  primaryAction: 'start' | 'end';
  progress?: {
    elapsedMs: number;
    expectedMs: number;
  };
}

const MINUTE = 60 * 1000;

export function wakeWindowForAge(months: number): WakeWindow {
  if (months < 1) return { minMs: 45 * MINUTE, maxMs: 60 * MINUTE };
  if (months < 2) return { minMs: 60 * MINUTE, maxMs: 90 * MINUTE };
  if (months < 3) return { minMs: 75 * MINUTE, maxMs: 105 * MINUTE };
  if (months < 4) return { minMs: 90 * MINUTE, maxMs: 120 * MINUTE };
  if (months < 5) return { minMs: 105 * MINUTE, maxMs: 135 * MINUTE };
  if (months < 6) return { minMs: 120 * MINUTE, maxMs: 150 * MINUTE };
  if (months < 8) return { minMs: 135 * MINUTE, maxMs: 165 * MINUTE };
  if (months < 10) return { minMs: 150 * MINUTE, maxMs: 180 * MINUTE };
  if (months < 12) return { minMs: 180 * MINUTE, maxMs: 210 * MINUTE };
  if (months < 15) return { minMs: 210 * MINUTE, maxMs: 240 * MINUTE };
  if (months < 18) return { minMs: 240 * MINUTE, maxMs: 300 * MINUTE };
  if (months < 24) return { minMs: 270 * MINUTE, maxMs: 330 * MINUTE };
  if (months < 36) return { minMs: 330 * MINUTE, maxMs: 390 * MINUTE };
  return { minMs: 330 * MINUTE, maxMs: 420 * MINUTE };
}

export function expectedNapsForAge(months: number): number {
  if (months < 1) return 5;
  if (months < 3) return 4;
  if (months < 6) return 3;
  if (months < 15) return 2;
  if (months < 36) return 1;
  return 0;
}

export function bedtimeHintForAge(months: number): { earliest: number; latest: number } {
  if (months < 3) return { earliest: 19.5, latest: 22 };
  if (months < 6) return { earliest: 18.5, latest: 20 };
  if (months < 12) return { earliest: 18.5, latest: 19.75 };
  if (months < 24) return { earliest: 19, latest: 20.5 };
  if (months < 48) return { earliest: 19.5, latest: 20.75 };
  return { earliest: 19.75, latest: 21 };
}

export interface SleepTargets {
  totalHoursMin: number;
  totalHoursMax: number;
  nightHoursMin: number;
  nightHoursMax: number;
  napsMin: number;
  napsMax: number;
}

export function expectedSleepDurationMs(
  kind: SleepKind,
  months: number,
): number {
  if (kind === 'night') {
    if (months < 3) return 8 * 60 * 60 * 1000;
    if (months < 6) return 10 * 60 * 60 * 1000;
    return 11 * 60 * 60 * 1000;
  }
  if (months < 3) return 45 * 60 * 1000;
  if (months < 12) return 60 * 60 * 1000;
  if (months < 24) return 90 * 60 * 1000;
  return 75 * 60 * 1000;
}

export function sleepTargetsForAge(months: number): SleepTargets {
  if (months < 3) {
    return {
      totalHoursMin: 14,
      totalHoursMax: 17,
      nightHoursMin: 8,
      nightHoursMax: 10,
      napsMin: 4,
      napsMax: 5,
    };
  }
  if (months < 6) {
    return {
      totalHoursMin: 14,
      totalHoursMax: 15,
      nightHoursMin: 10,
      nightHoursMax: 11,
      napsMin: 3,
      napsMax: 4,
    };
  }
  if (months < 12) {
    return {
      totalHoursMin: 12,
      totalHoursMax: 14,
      nightHoursMin: 11,
      nightHoursMax: 12,
      napsMin: 2,
      napsMax: 3,
    };
  }
  if (months < 18) {
    return {
      totalHoursMin: 11,
      totalHoursMax: 14,
      nightHoursMin: 11,
      nightHoursMax: 12,
      napsMin: 1,
      napsMax: 2,
    };
  }
  if (months < 36) {
    return {
      totalHoursMin: 11,
      totalHoursMax: 14,
      nightHoursMin: 11,
      nightHoursMax: 12,
      napsMin: 1,
      napsMax: 1,
    };
  }
  return {
    totalHoursMin: 10,
    totalHoursMax: 13,
    nightHoursMin: 10,
    nightHoursMax: 12,
    napsMin: 0,
    napsMax: 1,
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

function dayBounds(day: Date, now: Date): [number, number] {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = dayStart + DAY_MS;
  const todayStart = startOfDay(now).getTime();
  const isToday = dayStart === todayStart;
  const upper = isToday ? now.getTime() : dayEnd;
  return [dayStart, upper];
}

export function sessionsForDay(
  sessions: SleepSession[],
  day: Date = new Date(),
  now: Date = new Date(),
): SleepSession[] {
  const [dayStart, upper] = dayBounds(day, now);
  return sessions.filter((s) => {
    const start = new Date(s.startedAt).getTime();
    const end = s.endedAt ? new Date(s.endedAt).getTime() : now.getTime();
    return end >= dayStart && start < upper;
  });
}

export function totalSleepForDayMs(
  sessions: SleepSession[],
  day: Date = new Date(),
  now: Date = new Date(),
): number {
  const [dayStart, upper] = dayBounds(day, now);
  return sessions.reduce((sum, s) => {
    const start = new Date(s.startedAt).getTime();
    const end = s.endedAt ? new Date(s.endedAt).getTime() : now.getTime();
    const overlapStart = Math.max(start, dayStart);
    const overlapEnd = Math.min(end, upper);
    return sum + Math.max(0, overlapEnd - overlapStart);
  }, 0);
}

export function napsCountForDay(
  sessions: SleepSession[],
  day: Date = new Date(),
  now: Date = new Date(),
): number {
  return sessionsForDay(sessions, day, now).filter(
    (s) => s.kind === 'nap' && s.endedAt,
  ).length;
}

export const sessionsToday = (sessions: SleepSession[], now = new Date()) =>
  sessionsForDay(sessions, now, now);
export const totalSleepTodayMs = (sessions: SleepSession[], now = new Date()) =>
  totalSleepForDayMs(sessions, now, now);
export const napsCountToday = (sessions: SleepSession[], now = new Date()) =>
  napsCountForDay(sessions, now, now);

export function lastCompletedSession(sessions: SleepSession[]): SleepSession | undefined {
  const completed = sessions.filter((s) => s.endedAt);
  if (completed.length === 0) return undefined;
  return completed.reduce((a, b) =>
    new Date(a.endedAt!).getTime() > new Date(b.endedAt!).getTime() ? a : b,
  );
}

export function activeSession(sessions: SleepSession[]): SleepSession | undefined {
  return sessions.find((s) => !s.endedAt);
}

export function lastWakeWindowMs(sessions: SleepSession[], now = new Date()): number | null {
  const last = lastCompletedSession(sessions);
  if (!last) return null;
  return now.getTime() - new Date(last.endedAt!).getTime();
}

function isShortNap(session: SleepSession): boolean {
  if (session.kind !== 'nap' || !session.endedAt) return false;
  const duration = new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime();
  return duration < 35 * MINUTE;
}

function hoursFraction(date: Date): number {
  return date.getHours() + date.getMinutes() / 60;
}

export function computeRecommendation(
  baby: Baby,
  sessions: SleepSession[],
  now = new Date(),
): Recommendation {
  const months = ageInMonths(baby, now);
  const active = activeSession(sessions);

  if (active) {
    const elapsed = now.getTime() - new Date(active.startedAt).getTime();
    const expectedMs = expectedSleepDurationMs(active.kind, months);
    return {
      state: 'sleeping',
      eyebrow:
        active.kind === 'night'
          ? t('recommendation.nightSleepInProgress')
          : t('recommendation.napInProgress'),
      primary: formatElapsed(elapsed),
      supporting: t('home.startedAt', {
        time: formatClock(new Date(active.startedAt)),
      }),
      primaryAction: 'end',
      progress: { elapsedMs: elapsed, expectedMs },
    };
  }

  const last = lastCompletedSession(sessions);
  const wakeWin = wakeWindowForAge(months);
  const bedtime = bedtimeHintForAge(months);
  const hoursNow = hoursFraction(now);

  const isEvening = hoursNow >= bedtime.earliest - 0.5;
  const pastLatestBedtime = hoursNow >= bedtime.latest;

  const todaySessions = sessionsToday(sessions, now);
  const shortNaps = todaySessions.filter(isShortNap).length;
  const napsDone = napsCountToday(sessions, now);
  const expectedNaps = expectedNapsForAge(months);

  const totalSleep = totalSleepTodayMs(sessions, now);

  let context: string | undefined;
  let contextTone: 'neutral' | 'warn' = 'neutral';

  if (shortNaps >= 2) {
    context = t('recommendation.shortNapsWarn');
    contextTone = 'warn';
  } else if (napsDone >= expectedNaps && expectedNaps > 0 && !isEvening) {
    context = t('recommendation.goingSmoothly');
  } else if (totalSleep === 0 && hoursNow > 10) {
    context = t('recommendation.noSleepYet');
  } else {
    context = t('recommendation.goingSmoothly');
  }

  if (!last) {
    if (isEvening) {
      return {
        state: 'bedtime',
        eyebrow: t('recommendation.tonight'),
        primary: formatBedtimeRange(bedtime),
        supporting: t('recommendation.windDown'),
        context,
        contextTone,
        primaryAction: 'start',
      };
    }
    return {
      state: 'due',
      eyebrow: t('recommendation.readyWhenYouAre'),
      primary: t('recommendation.anytime'),
      supporting: t('recommendation.firstSleep'),
      context,
      contextTone,
      primaryAction: 'start',
    };
  }

  const sinceWake = now.getTime() - new Date(last.endedAt!).getTime();
  const untilMin = wakeWin.minMs - sinceWake;
  const untilMax = wakeWin.maxMs - sinceWake;

  if (isEvening || pastLatestBedtime || (expectedNaps === 0 && hoursNow > 17)) {
    if (pastLatestBedtime) {
      return {
        state: 'bedtime',
        eyebrow: t('recommendation.bedtimeWindow'),
        primary: t('recommendation.now'),
        supporting: t('recommendation.earlierTonight'),
        context,
        contextTone: 'warn',
        primaryAction: 'start',
      };
    }
    const minsToLatest = Math.max(0, (bedtime.latest - hoursNow) * 60);
    return {
      state: 'bedtime',
      eyebrow: t('recommendation.bedtimeRoutine'),
      primary:
        minsToLatest < 20
          ? t('recommendation.inFewMin')
          : t('recommendation.inMin', {
              min: formatShortDuration(minsToLatest * MINUTE),
            }),
      supporting: t('recommendation.calmWindDown'),
      context,
      contextTone,
      primaryAction: 'start',
    };
  }

  if (untilMax <= 0) {
    return {
      state: 'overdue',
      eyebrow: t('recommendation.napWindow'),
      primary: t('recommendation.now'),
      supporting: t('recommendation.settleSoon'),
      context: context ?? t('recommendation.napWindowOpen'),
      contextTone: 'warn',
      primaryAction: 'start',
    };
  }

  if (untilMin <= 0) {
    return {
      state: 'due',
      eyebrow: t('recommendation.napWindow'),
      primary: t('recommendation.withinMin', {
        max: formatShortDuration(untilMax),
      }),
      supporting: t('recommendation.goodTime'),
      context,
      contextTone,
      primaryAction: 'start',
    };
  }

  const supportingMinutes = Math.max(1, Math.round(untilMin / MINUTE) - 10);
  return {
    state: 'countdown',
    eyebrow: t('recommendation.nextNapIn'),
    primary: t('recommendation.range', {
      min: formatShortDuration(untilMin),
      max: formatShortDuration(untilMax),
    }),
    supporting: t('recommendation.startInAbout', {
      min: formatShortDuration(supportingMinutes * MINUTE),
    }),
    context,
    contextTone,
    primaryAction: 'start',
  };
}

function formatElapsed(ms: number): string {
  const totalMinutes = Math.floor(ms / MINUTE);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatBedtimeRange(bedtime: { earliest: number; latest: number }): string {
  return `${formatHour(bedtime.earliest)} – ${formatHour(bedtime.latest)}`;
}

function formatHour(frac: number): string {
  const h = Math.floor(frac);
  const m = Math.round((frac - h) * 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}
