import { useEffect } from 'react';
import { useBabyStore, useActiveBaby } from '@/state/babyStore';
import { useSleepStore } from '@/state/sleepStore';
import { useSubscription } from '@/subscription';
import type { SleepSession } from '@/logic/recommendation';
import {
  cancelAllBedtimeReminders,
  scheduleSleepReminders,
} from '@/services/notifications';

const EMPTY_SESSIONS: readonly SleepSession[] = [];

/**
 * Reactive scheduler for sleep reminders. Watches the active baby,
 * the bedtimeReminder preference, the Pro plan and the active baby's
 * sleep history, and (re)schedules notifications whenever any of
 * these changes. When disabled or the user is not Pro, all
 * reminders are cancelled.
 */
export function useSleepReminders(): void {
  const baby = useActiveBaby();
  const enabled = useBabyStore((s) => s.preferences.bedtimeReminder);
  const hydrated = useBabyStore((s) => s.hydrated);
  const { isPro } = useSubscription();
  const sessions = useSleepStore((s) => {
    if (!baby) return EMPTY_SESSIONS;
    return s.sessionsByBaby[baby.id] ?? EMPTY_SESSIONS;
  });

  useEffect(() => {
    if (!hydrated) return;
    if (!isPro || !enabled || !baby) {
      void cancelAllBedtimeReminders();
      return;
    }
    void scheduleSleepReminders(baby, sessions as SleepSession[]);
  }, [hydrated, isPro, enabled, baby, sessions]);
}

