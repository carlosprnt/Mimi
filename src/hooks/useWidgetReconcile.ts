import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useActiveBaby } from '@/state/babyStore';
import { useSleepStore } from '@/state/sleepStore';
import { readWidgetState } from '@/services/widgetSync';

/**
 * Bridges the iOS widget's play / stop buttons into the RN session
 * store. The widget AppIntents only stamp `sleepStartedAt` in the
 * shared App Group UserDefaults — they cannot reach into the RN
 * runtime. This hook reads that snapshot whenever the app comes back
 * to the foreground and reconciles:
 *
 *   - widget says active, app idle  → start a session at widget's
 *                                     timestamp.
 *   - widget says idle, app active  → end the current session (now).
 *   - both agree                    → no-op.
 *
 * Mount once at the root (App.tsx).
 */
export const useWidgetReconcile = (): void => {
  const baby = useActiveBaby();
  const startSleep = useSleepStore((s) => s.startSleep);
  const endSleep = useSleepStore((s) => s.endSleep);

  // Capture latest references so the AppState listener never reads
  // stale closures.
  const babyIdRef = useRef<string | null>(baby?.id ?? null);
  babyIdRef.current = baby?.id ?? null;

  useEffect(() => {
    const reconcile = async (): Promise<void> => {
      const babyId = babyIdRef.current;
      if (!babyId) return;
      const widget = await readWidgetState();
      if (!widget) return;

      const sessions = useSleepStore.getState().sessionsByBaby[babyId] ?? [];
      const active = sessions.find((s) => !s.endedAt) ?? null;

      if (widget.sleepStartedAt && !active) {
        // Widget started a session while the app was backgrounded —
        // adopt its timestamp.
        const startedAt = new Date(widget.sleepStartedAt);
        if (!Number.isNaN(startedAt.getTime())) {
          startSleep(babyId, startedAt);
        }
        return;
      }

      if (!widget.sleepStartedAt && active) {
        // Widget ended (or cleared) the session — end the app's
        // session now. Widget doesn't track an end timestamp, so
        // "now" is the best estimate.
        endSleep(babyId);
      }
    };

    // Run once on mount in case we missed a foreground event (e.g.
    // app launched cold from the widget tap).
    void reconcile();

    const sub = AppState.addEventListener(
      'change',
      (status: AppStateStatus) => {
        if (status === 'active') void reconcile();
      },
    );
    return () => {
      sub.remove();
    };
  }, [startSleep, endSleep]);
};
