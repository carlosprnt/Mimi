import { Baby, ageInMonths } from './age';
import { startOfDay } from './format';

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
}

const MINUTE = 60 * 1000;

export function wakeWindowForAge(months: number): WakeWindow {
  if (months < 1) return { minMs: 45 * MINUTE, maxMs: 60 * MINUTE };
  if (months < 2) return { minMs: 60 * MINUTE, maxMs: 75 * MINUTE };
  if (months < 4) return { minMs: 75 * MINUTE, maxMs: 105 * MINUTE };
  if (months < 6) return { minMs: 105 * MINUTE, maxMs: 135 * MINUTE };
  if (months < 9) return { minMs: 135 * MINUTE, maxMs: 165 * MINUTE };
  if (months < 12) return { minMs: 150 * MINUTE, maxMs: 210 * MINUTE };
  if (months < 18) return { minMs: 180 * MINUTE, maxMs: 240 * MINUTE };
  if (months < 36) return { minMs: 240 * MINUTE, maxMs: 330 * MINUTE };
  return { minMs: 300 * MINUTE, maxMs: 420 * MINUTE };
}

export function expectedNapsForAge(months: number): number {
  if (months < 4) return 4;
  if (months < 6) return 3;
  if (months < 15) return 2;
  if (months < 36) return 1;
  return 0;
}

export function bedtimeHintForAge(months: number): { earliest: number; latest: number } {
  if (months < 4) return { earliest: 19, latest: 21 };
  if (months < 12) return { earliest: 18.5, latest: 20 };
  if (months < 36) return { earliest: 19, latest: 20.5 };
  return { earliest: 19.5, latest: 21 };
}

export function sessionsToday(sessions: SleepSession[], now = new Date()): SleepSession[] {
  const dayStart = startOfDay(now).getTime();
  return sessions.filter((s) => {
    const end = s.endedAt ? new Date(s.endedAt).getTime() : now.getTime();
    return end >= dayStart;
  });
}

export function totalSleepTodayMs(sessions: SleepSession[], now = new Date()): number {
  const dayStart = startOfDay(now).getTime();
  return sessionsToday(sessions, now).reduce((sum, s) => {
    const start = Math.max(new Date(s.startedAt).getTime(), dayStart);
    const end = s.endedAt ? new Date(s.endedAt).getTime() : now.getTime();
    return sum + Math.max(0, end - start);
  }, 0);
}

export function napsCountToday(sessions: SleepSession[], now = new Date()): number {
  return sessionsToday(sessions, now).filter((s) => s.kind === 'nap' && s.endedAt).length;
}

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
    return {
      state: 'sleeping',
      eyebrow: active.kind === 'night' ? 'NIGHT SLEEP IN PROGRESS' : 'NAP IN PROGRESS',
      primary: formatElapsed(elapsed),
      supporting: active.kind === 'night' ? 'Resting. Mimi will wait.' : 'Sleeping since ' + formatClock(new Date(active.startedAt)),
      primaryAction: 'end',
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
    context = 'Short naps today — a slightly earlier bedtime may help.';
    contextTone = 'warn';
  } else if (napsDone >= expectedNaps && expectedNaps > 0 && !isEvening) {
    context = 'Today is going smoothly.';
  } else if (totalSleep === 0 && hoursNow > 10) {
    context = 'No sleep logged yet today — trust your instincts.';
  } else {
    context = 'Today is going smoothly.';
  }

  if (!last) {
    if (isEvening) {
      return {
        state: 'bedtime',
        eyebrow: 'TONIGHT',
        primary: formatBedtimeRange(bedtime),
        supporting: 'A calm wind-down can begin any time.',
        context,
        contextTone,
        primaryAction: 'start',
      };
    }
    return {
      state: 'due',
      eyebrow: 'READY WHEN YOU ARE',
      primary: 'Anytime',
      supporting: 'Start the first sleep whenever it feels right.',
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
        eyebrow: 'BEDTIME WINDOW',
        primary: 'Now',
        supporting: 'A little earlier tonight may feel easier.',
        context,
        contextTone: 'warn',
        primaryAction: 'start',
      };
    }
    const minsToLatest = Math.max(0, (bedtime.latest - hoursNow) * 60);
    return {
      state: 'bedtime',
      eyebrow: 'BEDTIME ROUTINE',
      primary: minsToLatest < 20 ? 'In a few min' : `In ~${Math.round(minsToLatest)} min`,
      supporting: 'A calm wind-down can begin now.',
      context,
      contextTone,
      primaryAction: 'start',
    };
  }

  if (untilMax <= 0) {
    return {
      state: 'overdue',
      eyebrow: 'NAP WINDOW',
      primary: 'Now',
      supporting: 'Try settling in the next few minutes.',
      context: context ?? 'Nap window has opened.',
      contextTone: 'warn',
      primaryAction: 'start',
    };
  }

  if (untilMin <= 0) {
    return {
      state: 'due',
      eyebrow: 'NAP WINDOW',
      primary: `Within ~${Math.round(untilMax / MINUTE)} min`,
      supporting: 'Good time to begin the routine.',
      context,
      contextTone,
      primaryAction: 'start',
    };
  }

  const supportingMinutes = Math.max(1, Math.round(untilMin / MINUTE) - 10);
  return {
    state: 'countdown',
    eyebrow: 'NEXT NAP LIKELY IN',
    primary: `${Math.round(untilMin / MINUTE)} – ${Math.round(untilMax / MINUTE)} min`,
    supporting: `Start the routine in about ${supportingMinutes} min.`,
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
