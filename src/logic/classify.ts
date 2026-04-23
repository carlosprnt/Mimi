import { SleepKind } from './recommendation';

export function classifyByStart(startedAt: Date): SleepKind {
  const hour = startedAt.getHours() + startedAt.getMinutes() / 60;
  if (hour >= 18.5 || hour < 6) return 'night';
  return 'nap';
}
