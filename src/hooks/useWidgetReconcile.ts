import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { readWidgetState } from '@/services/widgetSync';
import { useBabyStore } from '@/state/babyStore';
import { useSleepStore } from '@/state/sleepStore';

/**
 * Bidirectional sync from the iOS Widget Extension back into the
 * React Native app.
 *
 * The widget's StartSleepIntent / StopSleepIntent stamp
 * `sleepStartedAt` in the App Group's shared UserDefaults. When the
 * app comes to foreground we read that value and reconcile against
 * the local sleepStore:
 *
 *   - widget says sleep is active, app has no active session →
 *     create a local session that started at the widget's timestamp.
 *   - widget says no sleep is active, app has an active session →
 *     end the local session.
 *
 * Mount once near the root (App.tsx). Without this hook the widget
 * → app direction would silently desync.
 */
export const useWidgetReconcile = (): void => {
  useEffect(() => {
    const reconcile = async (): Promise<void> => {
      const widget = await readWidgetState();
      const activeBabyId = useBabyStore.getState().activeBabyId;
      if (!activeBabyId) return;

      const sessions =
        useSleepStore.getState().sessionsByBaby[activeBabyId] ?? [];
      const localActive = sessions.find((s) => !s.endedAt) ?? null;

      const widgetActiveAt = widget.sleepStartedAt
        ? new Date(widget.sleepStartedAt)
        : null;

      if (widgetActiveAt && !localActive) {
        // Widget started a sleep while we were backgrounded — adopt it.
        useSleepStore.getState().startSleep(activeBabyId, widgetActiveAt);
      } else if (!widgetActiveAt && localActive) {
        // Widget ended a sleep while we were backgrounded — close ours.
        useSleepStore.getState().endSleep(activeBabyId);
      }
    };

    void reconcile();

    const onChange = (next: AppStateStatus): void => {
      if (next === 'active') void reconcile();
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);
};
