import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mimiStorage } from './persist';
import { CareEvent } from '@/logic/careEvents';

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
}

const eventsFor = (state: CareEventState, babyId: string): CareEvent[] =>
  state.eventsByBaby[babyId] ?? [];

export const useCareEventStore = create<CareEventState>()(
  persist(
    (set) => ({
      eventsByBaby: {},
      addCareEvent: (babyId, event) =>
        set((state) => ({
          eventsByBaby: {
            ...state.eventsByBaby,
            [babyId]: [event, ...eventsFor(state, babyId)],
          },
        })),
      updateCareEvent: (babyId, id, patch) =>
        set((state) => ({
          eventsByBaby: {
            ...state.eventsByBaby,
            [babyId]: eventsFor(state, babyId).map((e) =>
              e.id === id ? { ...e, ...patch } : e,
            ),
          },
        })),
      removeCareEvent: (babyId, id) =>
        set((state) => ({
          eventsByBaby: {
            ...state.eventsByBaby,
            [babyId]: eventsFor(state, babyId).filter((e) => e.id !== id),
          },
        })),
      dropBaby: (babyId) =>
        set((state) => {
          const next = { ...state.eventsByBaby };
          delete next[babyId];
          return { eventsByBaby: next };
        }),
    }),
    {
      name: 'mimi-care-events',
      storage: mimiStorage,
      version: 1,
      partialize: (state) => ({ eventsByBaby: state.eventsByBaby }),
    },
  ),
);

export const useCareEventsForBaby = (babyId: string | null): CareEvent[] => {
  return useCareEventStore((s) =>
    babyId ? s.eventsByBaby[babyId] ?? [] : [],
  );
};
