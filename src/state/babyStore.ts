import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mimiStorage } from './persist';
import { Baby } from '@/logic/age';
import { makeId } from '@/utils/id';
import {
  deleteBabyRemote,
  updateBabyRemote,
  upsertBabyRemote,
} from '@/services/babies';
import { setPreferencesRemote } from '@/services/preferences';
import {
  cancelAllBedtimeReminders,
  requestNotificationPermission,
  scheduleBedtimeReminder,
} from '@/services/notifications';
import { useAuthStore } from './authStore';

const currentUserId = (): string | null =>
  useAuthStore.getState().user?.id ?? null;

export interface Preferences {
  use24h: boolean;
  bedtimeReminder: boolean;
}

interface BabyState {
  babies: Baby[];
  activeBabyId: string | null;
  preferences: Preferences;
  hydrated: boolean;
  addBaby: (baby: Omit<Baby, 'id'>) => Baby;
  addBabyWithId: (baby: Baby) => Baby;
  setBabies: (babies: Baby[]) => void;
  updateBaby: (id: string, patch: Partial<Omit<Baby, 'id'>>) => void;
  removeBaby: (id: string) => void;
  setActiveBabyId: (id: string | null) => void;
  setPreferences: (patch: Partial<Preferences>) => void;
  reset: () => void;
  markHydrated: () => void;
}

const DEFAULT_PREFERENCES: Preferences = {
  use24h: true,
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
        const userId = currentUserId();
        if (userId) void upsertBabyRemote(userId, baby);
        return baby;
      },
      addBabyWithId: (baby) => {
        set((state) => ({
          babies: state.babies.some((b) => b.id === baby.id)
            ? state.babies.map((b) => (b.id === baby.id ? baby : b))
            : [...state.babies, baby],
          activeBabyId: state.activeBabyId ?? baby.id,
        }));
        const userId = currentUserId();
        if (userId) void upsertBabyRemote(userId, baby);
        return baby;
      },
      setBabies: (next) =>
        set((state) => ({
          babies: next,
          activeBabyId:
            state.activeBabyId &&
            next.some((b) => b.id === state.activeBabyId)
              ? state.activeBabyId
              : (next[0]?.id ?? null),
        })),
      updateBaby: (id, patch) => {
        set((state) => ({
          babies: state.babies.map((b) =>
            b.id === id ? { ...b, ...patch } : b,
          ),
        }));
        const userId = currentUserId();
        if (userId) void updateBabyRemote(id, patch);
      },
      removeBaby: (id) => {
        set((state) => {
          const remaining = state.babies.filter((b) => b.id !== id);
          const nextActive =
            state.activeBabyId === id
              ? (remaining[0]?.id ?? null)
              : state.activeBabyId;
          return { babies: remaining, activeBabyId: nextActive };
        });
        const userId = currentUserId();
        if (userId) void deleteBabyRemote(id);
      },
      setActiveBabyId: (id) => {
        const previousId = get().activeBabyId;
        if (previousId === id) return;
        set({ activeBabyId: id });
        const userId = currentUserId();
        if (userId) {
          const prefs = get().preferences;
          void setPreferencesRemote(userId, prefs, id);
        }
        // Reschedule bedtime reminder for the new active baby (their
        // age may map to a different bedtime).
        if (get().preferences.bedtimeReminder) {
          const baby = get().babies.find((b) => b.id === id);
          if (baby) void scheduleBedtimeReminder(baby);
          else void cancelAllBedtimeReminders();
        }
      },
      setPreferences: (patch) => {
        set((state) => ({
          preferences: { ...state.preferences, ...patch },
        }));
        const userId = currentUserId();
        if (userId) {
          const next = get().preferences;
          const activeId = get().activeBabyId;
          void setPreferencesRemote(userId, next, activeId);
        }
        // Bedtime reminder toggling: ON → ask permission and schedule
        // for the active baby; OFF → cancel every scheduled reminder.
        if (patch.bedtimeReminder !== undefined) {
          if (patch.bedtimeReminder) {
            const activeId = get().activeBabyId;
            const baby = get().babies.find((b) => b.id === activeId);
            if (baby) {
              void requestNotificationPermission().then((granted) => {
                if (granted) void scheduleBedtimeReminder(baby);
              });
            }
          } else {
            void cancelAllBedtimeReminders();
          }
        }
      },
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
