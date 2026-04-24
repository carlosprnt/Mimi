import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mimiStorage } from './persist';
import { Baby } from '@/logic/age';
import { makeId } from '@/utils/id';

export interface Preferences {
  use24h: boolean;
  remindersEnabled: boolean;
  bedtimeReminder: boolean;
}

interface BabyState {
  babies: Baby[];
  activeBabyId: string | null;
  preferences: Preferences;
  hydrated: boolean;
  addBaby: (baby: Omit<Baby, 'id'>) => Baby;
  updateBaby: (id: string, patch: Partial<Omit<Baby, 'id'>>) => void;
  removeBaby: (id: string) => void;
  setActiveBabyId: (id: string | null) => void;
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
    (set, get) => ({
      babies: [],
      activeBabyId: null,
      preferences: DEFAULT_PREFERENCES,
      hydrated: false,
      addBaby: (input) => {
        const baby: Baby = { ...input, id: makeId() };
        set((state) => ({
          babies: [...state.babies, baby],
          activeBabyId: state.activeBabyId ?? baby.id,
        }));
        return baby;
      },
      updateBaby: (id, patch) =>
        set((state) => ({
          babies: state.babies.map((b) =>
            b.id === id ? { ...b, ...patch } : b,
          ),
        })),
      removeBaby: (id) =>
        set((state) => {
          const remaining = state.babies.filter((b) => b.id !== id);
          const nextActive =
            state.activeBabyId === id
              ? (remaining[0]?.id ?? null)
              : state.activeBabyId;
          return { babies: remaining, activeBabyId: nextActive };
        }),
      setActiveBabyId: (id) => set({ activeBabyId: id }),
      setPreferences: (patch) =>
        set((state) => ({ preferences: { ...state.preferences, ...patch } })),
      reset: () =>
        set({
          babies: [],
          activeBabyId: null,
          preferences: DEFAULT_PREFERENCES,
        }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'mimi-baby',
      storage: mimiStorage,
      version: 2,
      partialize: (state) => ({
        babies: state.babies,
        activeBabyId: state.activeBabyId,
        preferences: state.preferences,
      }),
      migrate: (persisted: unknown, version: number) => {
        if (version < 2) {
          const legacy = persisted as {
            baby?: { name: string; dateOfBirth: string; prematureWeeks?: number } | null;
            preferences?: Preferences;
          };
          const legacyBaby = legacy?.baby
            ? [{ id: 'legacy', ...legacy.baby }]
            : [];
          return {
            babies: legacyBaby,
            activeBabyId: legacyBaby[0]?.id ?? null,
            preferences: legacy?.preferences ?? DEFAULT_PREFERENCES,
          };
        }
        return persisted as BabyState;
      },
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);

export const useActiveBaby = (): Baby | null => {
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const babies = useBabyStore((s) => s.babies);
  return babies.find((b) => b.id === activeBabyId) ?? null;
};
