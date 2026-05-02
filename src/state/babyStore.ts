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
  addBaby: (input: Omit<Baby, 'id'> & { id?: string }) => Baby;
  updateBaby: (id: string, patch: Partial<Omit<Baby, 'id'>>) => void;
  setActiveBaby: (id: string) => void;
  removeBaby: (id: string) => void;
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
        const baby: Baby = {
          id: input.id ?? makeId(),
          name: input.name,
          dateOfBirth: input.dateOfBirth,
          prematureWeeks: input.prematureWeeks,
        };
        set((state) => ({
          babies: [...state.babies, baby],
          activeBabyId: state.activeBabyId ?? baby.id,
        }));
        return baby;
      },
      updateBaby: (id, patch) =>
        set((state) => ({
          babies: state.babies.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),
      setActiveBaby: (id) => {
        const exists = get().babies.some((b) => b.id === id);
        if (!exists) return;
        set({ activeBabyId: id });
      },
      removeBaby: (id) =>
        set((state) => {
          const babies = state.babies.filter((b) => b.id !== id);
          const activeBabyId =
            state.activeBabyId === id ? babies[0]?.id ?? null : state.activeBabyId;
          return { babies, activeBabyId };
        }),
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
      version: 1,
      partialize: (state) => ({
        babies: state.babies,
        activeBabyId: state.activeBabyId,
        preferences: state.preferences,
      }),
      migrate: (persistedState: unknown, version: number) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return {
            babies: [],
            activeBabyId: null,
            preferences: DEFAULT_PREFERENCES,
          };
        }
        if (version >= 1) return persistedState as Partial<BabyState>;
        const legacy = persistedState as {
          baby?: Omit<Baby, 'id'> & { id?: string };
          preferences?: Preferences;
        };
        if (legacy.baby) {
          const id = legacy.baby.id ?? makeId();
          const migrated: Baby = {
            id,
            name: legacy.baby.name,
            dateOfBirth: legacy.baby.dateOfBirth,
            prematureWeeks: legacy.baby.prematureWeeks,
          };
          return {
            babies: [migrated],
            activeBabyId: id,
            preferences: legacy.preferences ?? DEFAULT_PREFERENCES,
          };
        }
        return {
          babies: [],
          activeBabyId: null,
          preferences: legacy.preferences ?? DEFAULT_PREFERENCES,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);

export function selectActiveBaby(state: BabyState): Baby | null {
  if (!state.activeBabyId) return state.babies[0] ?? null;
  return state.babies.find((b) => b.id === state.activeBabyId) ?? state.babies[0] ?? null;
}

export function useActiveBaby(): Baby | null {
  return useBabyStore(selectActiveBaby);
}
