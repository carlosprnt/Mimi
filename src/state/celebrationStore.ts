import { create } from 'zustand';

const DURATION_MS = 5000;

interface CelebrationStore {
  /** ID of the baby whose name should sparkle. */
  babyId: string | null;
  /** Timestamp the celebration started. */
  startedAt: number;
  /** Trigger a 5s celebration around the given baby's name. */
  trigger: (id: string) => void;
  clear: () => void;
}

export const useCelebrationStore = create<CelebrationStore>((set) => ({
  babyId: null,
  startedAt: 0,
  trigger: (id) => {
    set({ babyId: id, startedAt: Date.now() });
    setTimeout(() => {
      // Only clear if still the same celebration (avoid wiping a newer one).
      const cur = useCelebrationStore.getState();
      if (cur.babyId === id) {
        set({ babyId: null, startedAt: 0 });
      }
    }, DURATION_MS);
  },
  clear: () => set({ babyId: null, startedAt: 0 }),
}));
