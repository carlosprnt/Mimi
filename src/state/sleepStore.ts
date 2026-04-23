import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mimiStorage } from './persist';
import { SleepKind, SleepSession } from '@/logic/recommendation';
import { classifyByStart } from '@/logic/classify';
import { makeId } from '@/utils/id';

interface SleepState {
  sessions: SleepSession[];
  startSleep: (at?: Date) => SleepSession;
  endSleep: (at?: Date, kindOverride?: SleepKind) => SleepSession | undefined;
  updateSession: (id: string, patch: Partial<SleepSession>) => void;
  removeSession: (id: string) => void;
  clearAll: () => void;
}

export const useSleepStore = create<SleepState>()(
  persist(
    (set, get) => ({
      sessions: [],
      startSleep: (at = new Date()) => {
        const existing = get().sessions.find((s) => !s.endedAt);
        if (existing) return existing;
        const session: SleepSession = {
          id: makeId(),
          startedAt: at.toISOString(),
          endedAt: null,
          kind: classifyByStart(at),
        };
        set((state) => ({ sessions: [session, ...state.sessions] }));
        return session;
      },
      endSleep: (at = new Date(), kindOverride) => {
        const active = get().sessions.find((s) => !s.endedAt);
        if (!active) return undefined;
        const updated: SleepSession = {
          ...active,
          endedAt: at.toISOString(),
          kind: kindOverride ?? active.kind,
        };
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === active.id ? updated : s)),
        }));
        return updated;
      },
      updateSession: (id, patch) =>
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),
      removeSession: (id) =>
        set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),
      clearAll: () => set({ sessions: [] }),
    }),
    {
      name: 'mimi-sleep',
      storage: mimiStorage,
      partialize: (state) => ({ sessions: state.sessions }),
    },
  ),
);
