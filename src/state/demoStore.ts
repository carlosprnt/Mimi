import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mimiStorage } from './persist';
import { Baby } from '@/logic/age';
import { SleepSession } from '@/logic/recommendation';
import { CareEvent } from '@/logic/careEvents';
import { getScenario } from '@/dev/demoScenarios';

interface Snapshot {
  babies: Baby[];
  activeBabyId: string | null;
  sessionsByBaby: Record<string, SleepSession[]>;
  eventsByBaby: Record<string, CareEvent[]>;
}

interface DemoState {
  /** Active scenario id, or null when showing real data. */
  active: string | null;
  /** Frozen copy of real store data saved before the first demo was loaded. */
  snapshot: Snapshot | null;
  activate: (scenarioId: string) => void;
  restore: () => void;
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      active: null,
      snapshot: null,

      activate: (scenarioId) => {
        const scenario = getScenario(scenarioId);
        if (!scenario) return;

        // Lazy-import stores to avoid circular deps at module load time.
        const { useBabyStore } = require('./babyStore');
        const { useSleepStore } = require('./sleepStore');
        const { useCareEventStore } = require('./careEventStore');

        // Save real data snapshot only on first activation.
        const snap: Snapshot = get().snapshot ?? {
          babies: useBabyStore.getState().babies,
          activeBabyId: useBabyStore.getState().activeBabyId,
          sessionsByBaby: useSleepStore.getState().sessionsByBaby,
          eventsByBaby: useCareEventStore.getState().eventsByBaby,
        };

        // Build fresh demo data and push into stores.
        // setBabies / hydrateAll do NOT trigger remote sync.
        const { baby, sessions, events } = scenario.build();
        useBabyStore.getState().setBabies([baby]);
        useSleepStore.getState().hydrateAll({ [baby.id]: sessions });
        useCareEventStore.getState().hydrateAll({ [baby.id]: events });

        set({ active: scenarioId, snapshot: snap });
      },

      restore: () => {
        const snap = get().snapshot;

        const { useBabyStore } = require('./babyStore');
        const { useSleepStore } = require('./sleepStore');
        const { useCareEventStore } = require('./careEventStore');

        if (snap) {
          useBabyStore.getState().setBabies(snap.babies);
          // setBabies auto-picks the first baby; restore original active id.
          useBabyStore.setState({ activeBabyId: snap.activeBabyId });
          useSleepStore.getState().hydrateAll(snap.sessionsByBaby);
          useCareEventStore.getState().hydrateAll(snap.eventsByBaby);
        }

        set({ active: null, snapshot: null });
      },
    }),
    {
      name: 'mimi-demo',
      storage: mimiStorage,
      partialize: (state) => ({
        active: state.active,
        snapshot: state.snapshot,
      }),
    },
  ),
);
