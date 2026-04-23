import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mimiStorage } from './persist';
import { Baby } from '@/logic/age';

export interface Preferences {
  use24h: boolean;
  remindersEnabled: boolean;
  bedtimeReminder: boolean;
}

interface BabyState {
  baby: Baby | null;
  preferences: Preferences;
  hydrated: boolean;
  setBaby: (baby: Baby) => void;
  updateBaby: (patch: Partial<Baby>) => void;
  setPreferences: (patch: Partial<Preferences>) => void;
  reset: () => void;
  markHydrated: () => void;
}

const DEFAULT_PREFERENCES: Preferences = {
  use24h: true,
  remindersEnabled: false,
  bedtimeReminder: false,
};

export const useBabyStore = create<BabyState>()(
  persist(
    (set) => ({
      baby: null,
      preferences: DEFAULT_PREFERENCES,
      hydrated: false,
      setBaby: (baby) => set({ baby }),
      updateBaby: (patch) =>
        set((state) => ({ baby: state.baby ? { ...state.baby, ...patch } : state.baby })),
      setPreferences: (patch) =>
        set((state) => ({ preferences: { ...state.preferences, ...patch } })),
      reset: () => set({ baby: null, preferences: DEFAULT_PREFERENCES }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'mimi-baby',
      storage: mimiStorage,
      partialize: (state) => ({ baby: state.baby, preferences: state.preferences }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);
