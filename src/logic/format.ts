import { t } from '@/i18n';

export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return t('duration.mOnly', { minutes });
  if (minutes === 0) return t('duration.hOnly', { hours });
  return t('duration.hm', {
    hours,
    minutes: minutes.toString().padStart(2, '0'),
  });
}

export function formatShortDuration(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60000));
  if (minutes < 60) return t('duration.minutesShort', { minutes });
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0
    ? t('duration.hOnly', { hours })
    : t('duration.hm', { hours, minutes: rem });
}

export function formatRange(minMs: number, maxMs: number): string {
  const minMinutes = Math.max(0, Math.round(minMs / 60000));
  const maxMinutes = Math.max(minMinutes, Math.round(maxMs / 60000));
  return t('duration.range', { min: minMinutes, max: maxMinutes });
}

export function formatClock(date: Date, use24h = true): string {
  if (use24h) {
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatRelativePast(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return t('relativePast.justNow');
  if (minutes < 60) return t('relativePast.minAgo', { min: minutes });
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (rem === 0) return t('relativePast.hAgo', { h: hours });
  return t('relativePast.hmAgo', { h: hours, m: rem });
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function friendlyDateLabel(date: Date, now = new Date()): string {
  const today = startOfDay(now);
  const target = startOfDay(date);
  const diffDays = Math.round(
    (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return t('date.today');
  if (diffDays === 1) return t('date.yesterday');
  if (diffDays < 7) {
    return target.toLocaleDateString(undefined, {
      weekday: 'long',
    });
  }
  return target.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
