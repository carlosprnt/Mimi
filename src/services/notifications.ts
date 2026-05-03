import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ageInMonths, type Baby } from '@/logic/age';
import {
  bedtimeHintForAge,
  expectedSleepDurationMs,
  wakeWindowForAge,
} from '@/logic/recommendation';
import { t } from '@/i18n';

/**
 * Local sleep reminders. Mirrors the recommendation engine logic:
 * projects upcoming sleep times (naps + bedtime) from the last
 * completed session using age-appropriate wake windows, then
 * schedules a one-time notification REMINDER_LEAD_MIN minutes before
 * each. The hook useSleepReminders() reschedules after every session
 * change, so notifications stay in sync with the actual schedule.
 */

const REMINDER_LEAD_MIN = 20;
const ID_PREFIX = 'mimi-bedtime-';
const MAX_REMINDERS = 5;
const LOOK_AHEAD_HOURS = 48;
const ASSUMED_MORNING_WAKE_HOUR = 7;

interface SleepLikeSession {
  startedAt: string;
  endedAt: string | null;
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

function floatToDate(base: Date, hoursFloat: number): Date {
  const d = new Date(base);
  const h = Math.floor(hoursFloat);
  const m = Math.round((hoursFloat - h) * 60);
  d.setHours(h, m, 0, 0);
  return d;
}

interface UpcomingSleep {
  time: Date;
  kind: 'nap' | 'night';
}

/**
 * Projects upcoming sleep times (naps + bedtime) using the same wake-window
 * logic as the recommendation engine. Starting from the last completed
 * session end, advances by the average wake window to find each successive
 * sleep time. When a projected sleep lands in bedtime territory it pins to
 * the age-based earliest bedtime and then resets to the next morning.
 * Returns up to MAX_REMINDERS future entries with their kind.
 */
function projectUpcomingSleepTimes(
  baby: Baby,
  sessions: SleepLikeSession[],
  now: Date,
): UpcomingSleep[] {
  const months = ageInMonths(baby, now);
  const wakeWin = wakeWindowForAge(months);
  const napDurationMs = expectedSleepDurationMs('nap', months);
  const bedtime = bedtimeHintForAge(months);
  const avgWakeMs = (wakeWin.minMs + wakeWin.maxMs) / 2;

  const lastCompleted = sessions
    .filter((s) => s.endedAt)
    .sort((a, b) => new Date(b.endedAt!).getTime() - new Date(a.endedAt!).getTime())[0];

  let currentWakeMs = lastCompleted
    ? new Date(lastCompleted.endedAt!).getTime()
    : now.getTime();

  const horizon = now.getTime() + LOOK_AHEAD_HOURS * 60 * 60 * 1000;
  const results: UpcomingSleep[] = [];

  while (results.length < MAX_REMINDERS && currentWakeMs < horizon) {
    const nextSleepMs = currentWakeMs + avgWakeMs;
    const nextSleepDate = new Date(nextSleepMs);
    const nextSleepHour = nextSleepDate.getHours() + nextSleepDate.getMinutes() / 60;

    if (nextSleepHour >= bedtime.earliest - 0.25) {
      // Project lands in bedtime territory — pin to age-based earliest bedtime.
      const bedtimeDate = floatToDate(nextSleepDate, bedtime.earliest);
      if (bedtimeDate.getTime() > now.getTime()) {
        results.push({ time: bedtimeDate, kind: 'night' });
      }
      // Advance to the next morning and repeat for the following day.
      const tomorrow = new Date(nextSleepDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(ASSUMED_MORNING_WAKE_HOUR, 0, 0, 0);
      currentWakeMs = tomorrow.getTime();
    } else {
      if (nextSleepMs > now.getTime()) {
        results.push({ time: nextSleepDate, kind: 'nap' });
      }
      currentWakeMs = nextSleepMs + napDurationMs;
    }
  }

  return results;
}

/**
 * Schedule (or replace) sleep reminders for a given baby. Cancels any
 * existing reminders, then projects upcoming nap/bedtime times using
 * wake-window logic and schedules a one-time notification
 * REMINDER_LEAD_MIN minutes before each. Because useSleepReminders()
 * calls this reactively after every session change, the schedule stays
 * in sync with the baby's actual day.
 */
export const scheduleSleepReminders = async (
  baby: Baby,
  sessions: SleepLikeSession[],
): Promise<void> => {
  await ensureChannelAndroid();
  await cancelAllBedtimeReminders();

  const now = new Date();
  const upcomingSleepTimes = projectUpcomingSleepTimes(baby, sessions, now);

  for (let i = 0; i < upcomingSleepTimes.length; i++) {
    const { time: sleepTime, kind } = upcomingSleepTimes[i];
    const notifTime = new Date(sleepTime.getTime() - REMINDER_LEAD_MIN * 60 * 1000);

    if (notifTime <= now) continue;

    const title =
      kind === 'night'
        ? t('notifications.bedtimeTitle', { name: baby.name })
        : t('notifications.napTitle', { name: baby.name });
    const body =
      kind === 'night'
        ? t('notifications.bedtimeBody')
        : t('notifications.napBody');

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: idFor(baby.id, i),
        content: {
          title,
          body,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notifTime,
          channelId: 'bedtime-reminder',
        },
      });
    } catch {
      // Permission not granted yet or scheduling rejected.
    }
  }
};
