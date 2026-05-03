import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ageInMonths, type Baby } from '@/logic/age';
import { bedtimeHintForAge } from '@/logic/recommendation';
import { t } from '@/i18n';

/**
 * Local sleep reminders. Adaptive to each baby's actual schedule:
 * derives typical sleep start times from the last 14 days of history
 * (clusters within 60 min, requires at least 3 occurrences) and
 * schedules a daily notification REMINDER_LEAD_MIN minutes before
 * each cluster's average. Falls back to the age-based bedtime hint
 * when there's not enough data yet.
 */

const REMINDER_LEAD_MIN = 20;
const ID_PREFIX = 'mimi-bedtime-';
const HISTORY_DAYS = 14;
const CLUSTER_WINDOW_MIN = 60;
const MIN_OCCURRENCES = 3;
const MAX_REMINDERS = 5;

interface SleepLikeSession {
  startedAt: string;
}

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // expo-notifications native module not available — best-effort no-ops below.
}

const idFor = (babyId: string, slot: number): string =>
  `${ID_PREFIX}${babyId}-${slot}`;

const ensureChannelAndroid = async (): Promise<void> => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('bedtime-reminder', {
    name: 'Sleep reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  if (!existing.canAskAgain) {
    Alert.alert(
      t('notifications.permissionDeniedTitle'),
      t('notifications.permissionDeniedBody'),
    );
    return false;
  }
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
};

export const cancelAllBedtimeReminders = async (): Promise<void> => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.identifier.startsWith(ID_PREFIX)) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch {
    // ignore
  }
};

/**
 * Cluster recent sleep starts and return typical times of day (in
 * minutes-of-day). Returns at most MAX_REMINDERS clusters, ordered by
 * frequency. Empty array when there isn't enough recurring pattern.
 */
function deriveTypicalSleepMinutes(
  sessions: SleepLikeSession[],
): number[] {
  const cutoff = Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000;
  const recent = sessions.filter(
    (s) => new Date(s.startedAt).getTime() >= cutoff,
  );
  if (recent.length < MIN_OCCURRENCES) return [];

  const minutes = recent
    .map((s) => {
      const d = new Date(s.startedAt);
      return d.getHours() * 60 + d.getMinutes();
    })
    .sort((a, b) => a - b);

  const clusters: number[][] = [];
  for (const m of minutes) {
    const last = clusters[clusters.length - 1];
    if (last && m - last[last.length - 1] <= CLUSTER_WINDOW_MIN) {
      last.push(m);
    } else {
      clusters.push([m]);
    }
  }

  return clusters
    .filter((c) => c.length >= MIN_OCCURRENCES)
    .map((c) => ({
      avg: Math.round(c.reduce((a, b) => a + b, 0) / c.length),
      count: c.length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_REMINDERS)
    .map((c) => c.avg)
    .sort((a, b) => a - b);
}

/**
 * Schedule (or replace) sleep reminders for a given baby. Cancels
 * any existing reminders for this baby, then schedules new ones at
 * each typical sleep start time minus REMINDER_LEAD_MIN. When there
 * isn't enough history to detect a pattern, falls back to the age-
 * based bedtime hint so a single reminder still fires.
 */
export const scheduleSleepReminders = async (
  baby: Baby,
  sessions: SleepLikeSession[],
): Promise<void> => {
  await ensureChannelAndroid();
  await cancelAllBedtimeReminders();

  const typical = deriveTypicalSleepMinutes(sessions);
  const triggers: number[] = [];

  if (typical.length > 0) {
    for (const m of typical) {
      const reminderMin = m - REMINDER_LEAD_MIN;
      if (reminderMin >= 0 && reminderMin < 24 * 60) triggers.push(reminderMin);
    }
  } else {
    const months = ageInMonths(baby);
    const bedtime = bedtimeHintForAge(months);
    const fallback = Math.round(bedtime.earliest * 60) - REMINDER_LEAD_MIN;
    if (fallback >= 0 && fallback < 24 * 60) triggers.push(fallback);
  }

  for (let i = 0; i < triggers.length; i++) {
    const total = triggers[i];
    const hour = Math.floor(total / 60);
    const minute = total % 60;
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: idFor(baby.id, i),
        content: {
          title: t('notifications.bedtimeTitle', { name: baby.name }),
          body: t('notifications.bedtimeBody'),
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: 'bedtime-reminder',
        },
      });
    } catch {
      // Permission not granted yet or scheduling rejected.
    }
  }
};

