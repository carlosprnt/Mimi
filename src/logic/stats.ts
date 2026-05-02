import { SleepSession } from './recommendation';
import { startOfDay } from './format';

export interface DayBucket {
  dayStart: number; // ms
  totalMs: number;
  napCount: number;
  longestMs: number;
  sessions: SleepSession[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function bucketKey(date: Date): number {
  return startOfDay(date).getTime();
}

export function bucketByDay(
  sessions: SleepSession[],
  windowDays = 7,
  now: Date = new Date(),
): DayBucket[] {
  const completed = sessions.filter((s) => s.endedAt);
  const today = bucketKey(now);
  const buckets: DayBucket[] = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const dayStart = today - i * DAY_MS;
    buckets.push({ dayStart, totalMs: 0, napCount: 0, longestMs: 0, sessions: [] });
  }
  for (const s of completed) {
    const startedAt = new Date(s.startedAt).getTime();
    const endedAt = new Date(s.endedAt!).getTime();
    const duration = Math.max(0, endedAt - startedAt);
    const dayStart = bucketKey(new Date(startedAt));
    const bucket = buckets.find((b) => b.dayStart === dayStart);
    if (!bucket) continue;
    bucket.totalMs += duration;
    bucket.longestMs = Math.max(bucket.longestMs, duration);
    if (s.kind === 'nap') bucket.napCount += 1;
    bucket.sessions.push(s);
  }
  return buckets;
}

export function averageTotalSleepMs(buckets: DayBucket[]): number {
  if (buckets.length === 0) return 0;
  const sum = buckets.reduce((acc, b) => acc + b.totalMs, 0);
  return Math.round(sum / buckets.length);
}

export function averageNapsPerDay(buckets: DayBucket[]): number {
  if (buckets.length === 0) return 0;
  const days = buckets.filter((b) => b.totalMs > 0).length || buckets.length;
  const sum = buckets.reduce((acc, b) => acc + b.napCount, 0);
  return Math.round((sum / days) * 10) / 10;
}

export function longestSleepMs(buckets: DayBucket[]): number {
  return buckets.reduce((acc, b) => Math.max(acc, b.longestMs), 0);
}

export function streakWithSleepLogged(buckets: DayBucket[]): number {
  let streak = 0;
  for (let i = buckets.length - 1; i >= 0; i--) {
    if (buckets[i].totalMs > 0) streak += 1;
    else break;
  }
  return streak;
}

export interface StatDescriptor {
  key: string;
  titleKey: string;
}

export const STAT_DESCRIPTORS: StatDescriptor[] = [
  { key: 'totalSleepDaily', titleKey: 'Sueño total por día' },
  { key: 'avgNapsDaily', titleKey: 'Siestas por día' },
  { key: 'longestSleep', titleKey: 'Sueño más largo' },
  { key: 'streak', titleKey: 'Días con sueño registrado' },
];
