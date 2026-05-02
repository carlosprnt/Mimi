import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ageInMonths, type Baby } from '@/logic/age';
import { bedtimeHintForAge } from '@/logic/recommendation';
import { t } from '@/i18n';

/**
 * Local notifications for bedtime reminders.
 *
 *   - The reminder fires REMINDER_LEAD_MIN minutes BEFORE the
 *     baby's earliest typical bedtime for their age (derived from
 *     bedtimeHintForAge).
 *   - Daily repeating: a single scheduled trigger with repeats=true,
 *     so iOS keeps firing it until cancelled.
 *   - Per-baby identifier so we can swap reminders cleanly when the
 *     active baby changes.
 *
 * No remote / push setup — purely local. Works in Expo Go.
 */

const REMINDER_LEAD_MIN = 20;
const ID_PREFIX = 'mimi-bedtime-';

// Foreground notification handler: when the app is open we still want
// the OS banner/sound (otherwise iOS swallows the notification).
// Wrapped in try/catch because in environments without the native
// module linked (e.g. Expo Go on iOS) the call throws synchronously
// at import time and would crash the whole app.
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
  // expo-notifications native module not available — features below
  // become best-effort no-ops via their own try/catch wrappers.
}

const idFor = (babyId: string): string => `${ID_PREFIX}${babyId}`;

const ensureChannelAndroid = async (): Promise<void> => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('bedtime-reminder', {
    name: t('notifications.bedtimeChannelName'),
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
};

/**
 * Request OS permission to show notifications. If the user previously
 * denied, surface an Alert explaining how to re-enable in Settings.
 * Returns true only when permission is granted.
 */
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

export const cancelBedtimeReminder = async (
  babyId: string,
): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(idFor(babyId));
  } catch {
    // Already cancelled / missing — fine.
  }
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
 * Schedule (or replace) a daily bedtime reminder for a given baby.
 * Computes 20 minutes before the EARLIEST bedtime hint for the
 * baby's age. Falls back gracefully if the resulting hour is outside
 * the valid 0-23 range.
 */
export const scheduleBedtimeReminder = async (baby: Baby): Promise<void> => {
  const months = ageInMonths(baby);
  const bedtime = bedtimeHintForAge(months);
  const totalMinutes =
    Math.round(bedtime.earliest * 60) - REMINDER_LEAD_MIN;
  if (totalMinutes < 0 || totalMinutes >= 24 * 60) return;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;

  await ensureChannelAndroid();
  await cancelBedtimeReminder(baby.id);

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: idFor(baby.id),
      content: {
        title: t('notifications.bedtimeTitle', { name: baby.name }),
        body: t('notifications.bedtimeBody'),
        sound: true,
      },
      // Explicit DAILY trigger type. The legacy `{ hour, minute,
      // repeats: true }` shorthand was deprecated in v0.32 and is
      // now mis-parsed as an interval trigger that fires almost
      // immediately — the cause of the "every time I switch baby a
      // notification fires" bug.
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: 'bedtime-reminder',
      },
    });
  } catch {
    // Permission not granted yet, or scheduling rejected — caller is
    // expected to ensure permission first via
    // requestNotificationPermission().
  }
};
