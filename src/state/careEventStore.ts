import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mimiStorage } from './persist';
import { CareEvent } from '@/logic/careEvents';
import {
  deleteCareEventRemote,
  upsertCareEvent,
} from '@/services/careEvents';
import { useAuthStore } from './authStore';

const currentUserId = (): string | null =>
  useAuthStore.getState().user?.id ?? null;

type CareEventsByBaby = Record<string, CareEvent[]>;

interface CareEventState {
  eventsByBaby: CareEventsByBaby;
  addCareEvent: (babyId: string, event: CareEvent) => void;
  updateCareEvent: (
    babyId: string,
    id: string,
    patch: Partial<CareEvent>,
  ) => void;
  removeCareEvent: (babyId: string, id: string) => void;
  dropBaby: (babyId: string) => void;
  resetAll: () => void;
  hydrateAll: (eventsByBaby: CareEventsByBaby) => void;
}

const eventsFor = (state: CareEventState, babyId: string): CareEvent[] =>
  state.eventsByBaby[babyId] ?? [];

export const useCareEventStore = create<CareEventState>()(
  persist(
    (set) => ({
      eventsByBaby: {},
      addCareEvent: (babyId, event) => {
        set((state) => ({
          eventsByBaby: {
            ...state.eventsByBaby,
            [babyId]: [event, ...eventsFor(state, babyId)],
          },
        }));
        const userId = currentUserId();
        if (userId) void upsertCareEvent(userId, babyId, event);
      },
      updateCareEvent: (babyId, id, patch) => {
        let updated: CareEvent | undefined;
        set((state) => ({
          eventsByBaby: {
            ...state.eventsByBaby,
            [babyId]: eventsFor(state, babyId).map((e) => {
              if (e.id !== id) return e;
              updated = { ...e, ...patch };
              return updated;
            }),
          },
        }));
        const userId = currentUserId();
        if (userId && updated) void upsertCareEvent(userId, babyId, updated);
      },
      removeCareEvent: (babyId, id) => {
        set((state) => ({
          eventsByBaby: {
            ...state.eventsByBaby,
            [babyId]: eventsFor(state, babyId).filter((e) => e.id !== id),
          },
        }));
        if (currentUserId()) void deleteCareEventRemote(id);
      },
      dropBaby: (babyId) =>
        set((state) => {
          const next = { ...state.eventsByBaby };
          delete next[babyId];
          return { eventsByBaby: next };
        }),
      resetAll: () => set({ eventsByBaby: {} }),
      hydrateAll: (eventsByBaby) => set({ eventsByBaby }),
    }),
    {
      name: 'mimi-care-events',
      storage: mimiStorage,
      version: 1,
      partialize: (state) => ({ eventsByBaby: state.eventsByBaby }),
    },
  ),
);

const EMPTY_EVENTS: CareEvent[] = [];

export const useCareEventsForBaby = (babyId: string | null): CareEvent[] => {
  return useCareEventStore((s) =>
    babyId ? s.eventsByBaby[babyId] ?? EMPTY_EVENTS : EMPTY_EVENTS,
  );
};
