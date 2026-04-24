import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mimiStorage } from './persist';
import { SleepKind, SleepSession } from '@/logic/recommendation';
import { classifyByStart } from '@/logic/classify';
import { makeId } from '@/utils/id';

type SessionsByBaby = Record<string, SleepSession[]>;

interface SleepState {
  sessionsByBaby: SessionsByBaby;
  startSleep: (babyId: string, at?: Date) => SleepSession | undefined;
  endSleep: (
    babyId: string,
    at?: Date,
    kindOverride?: SleepKind,
  ) => SleepSession | undefined;
  updateSession: (
    babyId: string,
    id: string,
    patch: Partial<SleepSession>,
  ) => void;
  addSession: (babyId: string, session: SleepSession) => void;
  removeSession: (babyId: string, id: string) => void;
  clearAll: (babyId: string) => void;
  dropBaby: (babyId: string) => void;
}

const sessionsFor = (state: SleepState, babyId: string): SleepSession[] =>
  state.sessionsByBaby[babyId] ?? [];

export const useSleepStore = create<SleepState>()(
  persist(
    (set, get) => ({
      sessionsByBaby: {},
      startSleep: (babyId, at = new Date()) => {
        if (!babyId) return undefined;
        const current = sessionsFor(get(), babyId);
        const existing = current.find((s) => !s.endedAt);
        if (existing) return existing;
        const session: SleepSession = {
          id: makeId(),
          startedAt: at.toISOString(),
          endedAt: null,
          kind: classifyByStart(at),
        };
        set((state) => ({
          sessionsByBaby: {
            ...state.sessionsByBaby,
            [babyId]: [session, ...current],
          },
        }));
        return session;
      },
      endSleep: (babyId, at = new Date(), kindOverride) => {
        if (!babyId) return undefined;
        const current = sessionsFor(get(), babyId);
        const active = current.find((s) => !s.endedAt);
        if (!active) return undefined;
        const updated: SleepSession = {
          ...active,
          endedAt: at.toISOString(),
          kind: kindOverride ?? active.kind,
        };
        set((state) => ({
          sessionsByBaby: {
            ...state.sessionsByBaby,
            [babyId]: current.map((s) => (s.id === active.id ? updated : s)),
          },
        }));
        return updated;
      },
      updateSession: (babyId, id, patch) =>
        set((state) => ({
          sessionsByBaby: {
            ...state.sessionsByBaby,
            [babyId]: sessionsFor(state, babyId).map((s) =>
              s.id === id ? { ...s, ...patch } : s,
            ),
          },
        })),
      addSession: (babyId, session) =>
        set((state) => ({
          sessionsByBaby: {
            ...state.sessionsByBaby,
            [babyId]: [session, ...sessionsFor(state, babyId)],
          },
        })),
      removeSession: (babyId, id) =>
        set((state) => ({
          sessionsByBaby: {
            ...state.sessionsByBaby,
            [babyId]: sessionsFor(state, babyId).filter((s) => s.id !== id),
          },
        })),
      clearAll: (babyId) =>
        set((state) => ({
          sessionsByBaby: { ...state.sessionsByBaby, [babyId]: [] },
        })),
      dropBaby: (babyId) =>
        set((state) => {
          const next = { ...state.sessionsByBaby };
          delete next[babyId];
          return { sessionsByBaby: next };
        }),
    }),
    {
      name: 'mimi-sleep',
      storage: mimiStorage,
      version: 2,
      partialize: (state) => ({ sessionsByBaby: state.sessionsByBaby }),
      migrate: (persisted: unknown, version: number) => {
        if (version < 2) {
          const legacy = persisted as { sessions?: SleepSession[] };
          const sessions = legacy?.sessions ?? [];
          return {
            sessionsByBaby: sessions.length > 0 ? { legacy: sessions } : {},
          };
        }
        return persisted as { sessionsByBaby: SessionsByBaby };
      },
    },
  ),
);

const EMPTY_SESSIONS: SleepSession[] = [];

export const useSessionsForBaby = (babyId: string | null): SleepSession[] => {
  return useSleepStore((s) =>
    babyId ? (s.sessionsByBaby[babyId] ?? EMPTY_SESSIONS) : EMPTY_SESSIONS,
  );
};
