import { startOfDay } from '@/logic/format';
import type { ProFeature, SubscriptionPlan } from './types';

export const FREE_BABY_LIMIT = 1;
export const FREE_TRACKING_DAYS = 7;
export const FREE_HISTORY_DAYS_BACK = 1; // today + yesterday
export const FREE_STAT_KEY = 'totalSleepDaily';

const PRO_FEATURES: readonly ProFeature[] = [
  'multipleBabies',
  'fullStats',
  'fullHistory',
  'notifications',
];

export function hasFeatureAccess(plan: SubscriptionPlan, feature: ProFeature): boolean {
  if (plan === 'pro') return true;
  return !PRO_FEATURES.includes(feature);
}

export function canAddBaby(childrenCount: number, plan: SubscriptionPlan): boolean {
  if (plan === 'pro') return true;
  return childrenCount < FREE_BABY_LIMIT;
}

export function canViewDate(date: Date, plan: SubscriptionPlan, now: Date = new Date()): boolean {
  if (plan === 'pro') return true;
  const diffMs = startOfDay(now).getTime() - startOfDay(date).getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays < 0) return true;
  return diffDays <= FREE_HISTORY_DAYS_BACK;
}

export function canViewStatistic(statKey: string, plan: SubscriptionPlan): boolean {
  if (plan === 'pro') return true;
  return statKey === FREE_STAT_KEY;
}

export function canTrackDay(
  sessions: { startedAt: string }[],
  date: Date,
  plan: SubscriptionPlan,
): boolean {
  if (plan === 'pro') return true;
  const dayKey = (d: Date) => startOfDay(d).toISOString();
  const targetDay = dayKey(date);
  if (sessions.some(s => dayKey(new Date(s.startedAt)) === targetDay)) return true;
  const uniqueDays = new Set(sessions.map(s => dayKey(new Date(s.startedAt))));
  return uniqueDays.size < FREE_TRACKING_DAYS;
}

export function canSwitchToBaby(
  babyId: string,
  activeBabyId: string | null,
  plan: SubscriptionPlan,
): boolean {
  if (plan === 'pro') return true;
  return babyId === activeBabyId;
}
