import { Baby, ageInMonths } from './age';
import { startOfDay } from './format';
import { formatShortDuration } from './format';
import { CareEvent } from './careEvents';
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

export type RecommendationRoot = 'SLEEPING' | 'UPCOMING' | 'NOW' | 'STAND_BY';

export interface Recommendation {
  root: RecommendationRoot;
  kind: SleepKind;
  confidence: 'high' | 'low';
  /** @deprecated kept for backward compatibility with consumers; prefer `root`. */
  state: 'sleeping' | 'countdown' | 'due' | 'overdue' | 'bedtime';
  eyebrow: string;
  primary: string;
  supporting?: string;
  context?: string;
  contextTone?: 'neutral' | 'warn';
  reasoning?: string;
  primaryAction: 'start' | 'end';
  progress?: {
    elapsedMs: number;
    expectedMs: number;
  };
}

const MINUTE = 60 * 1000;
const TRANSITION_BLEND_MONTHS = 0.7; // ~3 weeks

const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * Math.max(0, Math.min(1, t));

interface WakeBand {
  until: number;
  min: number;
  max: number;
}

const WAKE_WINDOW_BANDS: readonly WakeBand[] = [
  { until: 1, min: 45, max: 60 },
  { until: 2, min: 60, max: 90 },
  { until: 3, min: 75, max: 105 },
  { until: 4, min: 90, max: 120 },
  { until: 5, min: 105, max: 135 },
  { until: 6, min: 120, max: 150 },
  { until: 8, min: 135, max: 165 },
  { until: 10, min: 150, max: 180 },
  { until: 12, min: 180, max: 210 },
  { until: 15, min: 210, max: 240 },
  { until: 18, min: 240, max: 300 },
  { until: 24, min: 270, max: 330 },
  { until: 36, min: 330, max: 390 },
  { until: Infinity, min: 330, max: 420 },
];

interface BedtimeBand {
  until: number;
  earliest: number;
  latest: number;
}

const BEDTIME_BANDS: readonly BedtimeBand[] = [
  { until: 3, earliest: 19.5, latest: 22 },
  { until: 6, earliest: 18.5, latest: 20 },
  { until: 12, earliest: 18.5, latest: 19.75 },
  { until: 24, earliest: 19, latest: 20.5 },
  { until: 48, earliest: 19.5, latest: 20.75 },
  { until: Infinity, earliest: 19.75, latest: 21 },
];

function findBandIndex<T extends { until: number }>(
  bands: readonly T[],
  months: number,
): number {
  const i = bands.findIndex((b) => months < b.until);
  return i < 0 ? bands.length - 1 : i;
}

export function wakeWindowForAge(months: number): WakeWindow {
  const i = findBandIndex(WAKE_WINDOW_BANDS, months);
  const cur = WAKE_WINDOW_BANDS[i];
  const next = WAKE_WINDOW_BANDS[i + 1];
  if (!next || cur.until === Infinity) {
    return { minMs: cur.min * MINUTE, maxMs: cur.max * MINUTE };
  }
  const distanceToBoundary = cur.until - months;
  if (distanceToBoundary > TRANSITION_BLEND_MONTHS) {
    return { minMs: cur.min * MINUTE, maxMs: cur.max * MINUTE };
  }
  const blend = (TRANSITION_BLEND_MONTHS - distanceToBoundary) / TRANSITION_BLEND_MONTHS;
  return {
    minMs: lerp(cur.min, next.min, blend) * MINUTE,
    maxMs: lerp(cur.max, next.max, blend) * MINUTE,
  };
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
  const i = findBandIndex(BEDTIME_BANDS, months);
  const cur = BEDTIME_BANDS[i];
  const next = BEDTIME_BANDS[i + 1];
  if (!next || cur.until === Infinity) {
    return { earliest: cur.earliest, latest: cur.latest };
  }
  const distanceToBoundary = cur.until - months;
  if (distanceToBoundary > TRANSITION_BLEND_MONTHS) {
    return { earliest: cur.earliest, latest: cur.latest };
  }
  const blend = (TRANSITION_BLEND_MONTHS - distanceToBoundary) / TRANSITION_BLEND_MONTHS;
  return {
    earliest: lerp(cur.earliest, next.earliest, blend),
    latest: lerp(cur.latest, next.latest, blend),
  };
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
    (s) => s.kind === 'nap' && s.endedAt && !isMicroNap(s),
  ).length;
}

export function microNapsCountForDay(
  sessions: SleepSession[],
  day: Date = new Date(),
  now: Date = new Date(),
): number {
  return sessionsForDay(sessions, day, now).filter(isMicroNap).length;
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

const MICRO_NAP_THRESHOLD_MS = 15 * MINUTE;

export function isMicroNap(session: SleepSession): boolean {
  if (session.kind !== 'nap' || !session.endedAt) return false;
  const duration =
    new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime();
  return duration <= MICRO_NAP_THRESHOLD_MS;
}

function isShortNap(session: SleepSession): boolean {
  if (session.kind !== 'nap' || !session.endedAt) return false;
  const duration =
    new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime();
  return duration > MICRO_NAP_THRESHOLD_MS && duration < 35 * MINUTE;
}

const SHORT_NAP_REDUCTION_MS = 10 * MINUTE;

export function adjustedWakeWindow(
  base: WakeWindow,
  todayNaps: SleepSession[],
): WakeWindow {
  const shortCount = todayNaps.filter(isShortNap).length;
  if (shortCount === 0) return base;
  const reduction = Math.min(shortCount, 3) * SHORT_NAP_REDUCTION_MS;
  const minMs = Math.max(base.minMs - reduction, Math.round(base.minMs * 0.7));
  const maxMs = Math.max(base.maxMs - reduction, Math.round(base.maxMs * 0.75));
  return { minMs, maxMs };
}

function hoursFraction(date: Date): number {
  return date.getHours() + date.getMinutes() / 60;
}

const BEDTIME_CAP_PAST_LATEST_MS = 30 * MINUTE;

/** Computes the bedtime range for today, capped at +30m above the
 *  age-typical latest. Returns whether the cap was applied. */
export function computeBedtimeWindow(
  day: Date,
  bedtimeForAge: { earliest: number; latest: number },
  lastNapEnd: Date | null,
  wakeWindowMin: number,
): { from: Date; to: Date; capped: boolean; natural: Date | null } {
  const earliest = floatToTime(day, bedtimeForAge.earliest);
  const latest = floatToTime(day, bedtimeForAge.latest);
  const cap = new Date(latest.getTime() + BEDTIME_CAP_PAST_LATEST_MS);

  if (!lastNapEnd) {
    return { from: earliest, to: latest, capped: false, natural: null };
  }
  const natural = new Date(lastNapEnd.getTime() + wakeWindowMin);
  if (natural <= earliest) {
    return { from: earliest, to: latest, capped: false, natural };
  }
  if (natural >= cap) {
    // Capped to the maximum allowed bedtime.
    return { from: cap, to: cap, capped: true, natural };
  }
  // Natural fits between earliest and cap; show as the new range, with
  // the natural as the soft starting point.
  return { from: natural, to: latest > natural ? latest : cap, capped: false, natural };
}

const NIGHT_WAKE_RESTLESS_COUNT = 3;
const NIGHT_WAKE_RESTLESS_TOTAL_MS = 40 * MINUTE;
const NAP_TRANSITION_WEEKS = 3;
// Edges of stage transitions (in months). Around these, suggest gently.
const TRANSITION_POINTS_M = [6, 15, 36];

function withinTransitionWindow(months: number): boolean {
  const range = NAP_TRANSITION_WEEKS / 4.345;
  return TRANSITION_POINTS_M.some((p) => Math.abs(months - p) < range);
}

function recentRestlessNight(
  careEvents: CareEvent[],
  now: Date,
): boolean {
  // Considera despertares en la noche que ha terminado en las últimas
  // 24h: desde ayer 18:00 hasta ahora.
  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  start.setHours(18, 0, 0, 0);
  const end = now.getTime();
  let count = 0;
  let totalMs = 0;
  for (const ev of careEvents) {
    if (ev.kind !== 'nightWake') continue;
    const at = new Date(ev.at).getTime();
    if (at < start.getTime() || at > end) continue;
    count += 1;
    if (ev.endedAt) {
      totalMs += new Date(ev.endedAt).getTime() - at;
    }
  }
  return count >= NIGHT_WAKE_RESTLESS_COUNT || totalMs > NIGHT_WAKE_RESTLESS_TOTAL_MS;
}

function lastNapWasLong(
  sessions: SleepSession[],
  months: number,
  now: Date,
): boolean {
  const today = startOfDay(now).getTime();
  const todayCompletedNaps = sessions
    .filter(
      (s) =>
        s.kind === 'nap' &&
        s.endedAt &&
        new Date(s.endedAt).getTime() >= today,
    )
    .sort(
      (a, b) =>
        new Date(a.endedAt!).getTime() - new Date(b.endedAt!).getTime(),
    );
  const lastNap = todayCompletedNaps[todayCompletedNaps.length - 1];
  if (!lastNap) return false;
  const duration =
    new Date(lastNap.endedAt!).getTime() - new Date(lastNap.startedAt).getTime();
  const expected = expectedSleepDurationMs('nap', months);
  return duration > expected * 1.5;
}

export function computeRecommendation(
  baby: Baby,
  sessions: SleepSession[],
  now: Date = new Date(),
  careEvents: CareEvent[] = [],
): Recommendation {
  const months = ageInMonths(baby, now);
  const active = activeSession(sessions);

  // 1. SLEEPING — sesión activa
  if (active) {
    const elapsed = now.getTime() - new Date(active.startedAt).getTime();
    const expectedMs = expectedSleepDurationMs(active.kind, months);
    return {
      root: 'SLEEPING',
      kind: active.kind,
      confidence: 'high',
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

  // Anchor: el último punto conocido del que partir las proyecciones.
  // Puede ser el final de una sesión completada o un wake-anchor (despertar
  // matinal anotado sin sesión nocturna asociada).
  const lastSession = lastCompletedSession(sessions);
  const lastSessionEnd = lastSession
    ? new Date(lastSession.endedAt!).getTime()
    : 0;
  const morningWake = [...careEvents]
    .filter((e) => e.kind === 'morningWake')
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    .pop();
  const morningWakeAt = morningWake
    ? new Date(morningWake.at).getTime()
    : 0;
  const anchorIsWakeAnchor =
    morningWakeAt > 0 && morningWakeAt >= lastSessionEnd;
  const anchorMs =
    anchorIsWakeAnchor ? morningWakeAt : lastSession ? lastSessionEnd : 0;
  const hasAnchor = anchorMs > 0;
  const todaySessions = sessionsToday(sessions, now);
  const baseWakeWin = wakeWindowForAge(months);
  const wakeWin = adjustedWakeWindow(baseWakeWin, todaySessions);
  const wakeWindowShortened = wakeWin.minMs < baseWakeWin.minMs;
  const bedtime = bedtimeHintForAge(months);
  const hoursNow = hoursFraction(now);

  const isEvening = hoursNow >= bedtime.earliest - 0.5;
  const pastLatestBedtime = hoursNow >= bedtime.latest;

  const shortNaps = todaySessions.filter(isShortNap).length;
  const expectedNaps = expectedNapsForAge(months);
  const totalSleep = totalSleepTodayMs(sessions, now);

  // Context layer — prioridad descendente. Solo se muestra una.
  let context: string | undefined;
  let contextTone: 'neutral' | 'warn' = 'neutral';

  const restless = recentRestlessNight(careEvents, now);
  const longLast = lastNapWasLong(sessions, months, now);
  const transitionNear = withinTransitionWindow(months);

  if (totalSleep === 0 && hoursNow > 10) {
    context = t('recommendation.noSleepYet');
    contextTone = 'warn';
  } else if (restless) {
    context = t('recommendation.contextRestlessNight');
    contextTone = 'neutral';
  } else if (transitionNear) {
    context = t('recommendation.contextNapTransitionNear');
    contextTone = 'neutral';
  } else if (shortNaps >= 2 && !wakeWindowShortened) {
    // Si la ventana ya se acortó, la información vive en `reasoning` del
    // hero y no la repetimos aquí.
    context = t('recommendation.shortNapsWarn');
    contextTone = 'neutral';
  } else if (longLast) {
    context = t('recommendation.contextLongLastNap');
    contextTone = 'neutral';
  }

  // Reasoning (lo que tiene mayor relación con la sugerencia mostrada)
  const reasoningShortNaps = wakeWindowShortened
    ? t('recommendation.reasoningShortNaps')
    : undefined;

  // 2. STAND_BY — no hay último despertar conocido
  if (!hasAnchor) {
    if (isEvening) {
      return {
        root: 'STAND_BY',
        kind: 'night',
        confidence: 'low',
        state: 'bedtime',
        eyebrow: t('recommendation.tonight'),
        primary: t('recommendation.standByNightPrimary', {
          time: formatHour(bedtime.earliest),
        }),
        supporting: t('recommendation.standByNightSupporting'),
        reasoning: t('recommendation.reasoningHabitForAge'),
        context,
        contextTone,
        primaryAction: 'start',
      };
    }
    return {
      root: 'STAND_BY',
      kind: 'nap',
      confidence: 'low',
      state: 'due',
      eyebrow: t('recommendation.readyWhenYouAre'),
      primary: t('recommendation.anytime'),
      supporting: t('recommendation.firstSleep'),
      reasoning: t('recommendation.reasoningNoDataYet'),
      context,
      contextTone,
      primaryAction: 'start',
    };
  }

  const lastEnd = new Date(anchorMs);
  const sinceWake = now.getTime() - lastEnd.getTime();
  const untilMin = wakeWin.minMs - sinceWake;
  const untilMax = wakeWin.maxMs - sinceWake;
  const reasoningPartial = anchorIsWakeAnchor
    ? t('recommendation.reasoningPartialData')
    : undefined;

  // 3. Bedtime states. Calcula la ventana con cap.
  if (isEvening || pastLatestBedtime || (expectedNaps === 0 && hoursNow > 17)) {
    const bedtimeWindow = computeBedtimeWindow(
      now,
      bedtime,
      hasAnchor ? new Date(anchorMs) : null,
      wakeWin.minMs,
    );
    const bedtimeReasoning = bedtimeWindow.capped
      ? t('recommendation.reasoningCappedBedtime')
      : undefined;

    if (pastLatestBedtime) {
      return {
        root: 'NOW',
        kind: 'night',
        confidence: 'high',
        state: 'bedtime',
        eyebrow: t('recommendation.bedtimeWindow'),
        primary: t('recommendation.now'),
        supporting: t('recommendation.earlierTonight'),
        reasoning: bedtimeReasoning,
        context,
        contextTone: 'warn',
        primaryAction: 'start',
      };
    }
    const minsToFrom = Math.max(
      0,
      (bedtimeWindow.from.getTime() - now.getTime()) / MINUTE,
    );
    if (minsToFrom < 30) {
      return {
        root: 'NOW',
        kind: 'night',
        confidence: 'high',
        state: 'bedtime',
        eyebrow: t('recommendation.bedtimeRoutine'),
        primary: t('recommendation.inFewMin'),
        supporting: t('recommendation.inMin', {
          min: formatShortDuration(minsToFrom * MINUTE),
        }),
        reasoning: bedtimeReasoning,
        context,
        contextTone,
        primaryAction: 'start',
      };
    }
    // 4. UPCOMING + night
    return {
      root: 'UPCOMING',
      kind: 'night',
      confidence: 'high',
      state: 'bedtime',
      eyebrow: t('recommendation.bedtimeRoutine'),
      primary: `${formatClock(bedtimeWindow.from)} – ${formatClock(bedtimeWindow.to)}`,
      supporting: t('recommendation.nextNapClockSupporting', {
        duration: formatShortDuration(minsToFrom * MINUTE),
      }),
      reasoning: bedtimeReasoning,
      context,
      contextTone,
      primaryAction: 'start',
    };
  }

  const napConfidence: 'high' | 'low' = anchorIsWakeAnchor ? 'low' : 'high';
  const napReasoning = reasoningPartial ?? reasoningShortNaps;

  // 5. NOW + nap (overdue) — pasada la ventana max
  if (untilMax <= 0) {
    return {
      root: 'NOW',
      kind: 'nap',
      confidence: napConfidence,
      state: 'overdue',
      eyebrow: t('recommendation.napWindow'),
      primary: t('recommendation.now'),
      supporting: t('recommendation.settleSoon', {
        duration: formatShortDuration(-untilMax),
      }),
      reasoning: napReasoning,
      context,
      contextTone: 'warn',
      primaryAction: 'start',
    };
  }

  // 6. NOW + nap (within window)
  if (untilMin <= 0) {
    const windowEnd = new Date(now.getTime() + untilMax);
    return {
      root: 'NOW',
      kind: 'nap',
      confidence: napConfidence,
      state: 'due',
      eyebrow: t('recommendation.napWindow'),
      primary: t('recommendation.withinMin'),
      supporting: t('recommendation.napInRangeSupporting', {
        time: formatClock(windowEnd),
      }),
      reasoning: napReasoning,
      context,
      contextTone,
      primaryAction: 'start',
    };
  }

  // 7. UPCOMING + nap
  const napFrom = new Date(lastEnd.getTime() + wakeWin.minMs);
  const napTo = new Date(lastEnd.getTime() + wakeWin.maxMs);
  return {
    root: 'UPCOMING',
    kind: 'nap',
    confidence: napConfidence,
    state: 'countdown',
    eyebrow: t('recommendation.nextNapIn'),
    primary: `${formatClock(napFrom)} – ${formatClock(napTo)}`,
    supporting: t('recommendation.nextNapClockSupporting', {
      duration: `${formatShortDuration(untilMin)} – ${formatShortDuration(untilMax)}`,
    }),
    reasoning: reasoningShortNaps,
    context,
    contextTone,
    primaryAction: 'start',
  };
}

function floatToTime(day: Date, hoursFloat: number): Date {
  const d = new Date(day);
  const h = Math.floor(hoursFloat);
  const m = Math.round((hoursFloat - h) * 60);
  d.setHours(h, m, 0, 0);
  return d;
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
