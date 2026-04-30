import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mimiStorage } from './persist';

export type Sex = 'girl' | 'boy' | 'unspecified';

export interface OnboardingDraft {
  dob?: string;
  atTerm?: boolean;
  dueDate?: string;
  name?: string;
  sex?: Sex;
  startedAt?: string;
}

interface OnboardingDraftState extends OnboardingDraft {
  hydrated: boolean;
  set: (patch: Partial<OnboardingDraft>) => void;
  clear: () => void;
  markHydrated: () => void;
}

export const useOnboardingDraft = create<OnboardingDraftState>()(
  persist(
    (set) => ({
      hydrated: false,
      set: (patch) => set((state) => ({ ...state, ...patch })),
      clear: () =>
        set({
          dob: undefined,
          atTerm: undefined,
          dueDate: undefined,
          name: undefined,
          sex: undefined,
          startedAt: undefined,
        }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'mimi-onboarding-draft',
      storage: mimiStorage,
      version: 1,
      partialize: (state) => ({
        dob: state.dob,
        atTerm: state.atTerm,
        dueDate: state.dueDate,
        name: state.name,
        sex: state.sex,
        startedAt: state.startedAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);

/**
 * The Baby record stores sex as 'girl' | 'boy' | undefined (the
 * illustrations only branch on those two). Onboarding additionally
 * surfaces an explicit "prefiero no decirlo" choice ('unspecified')
 * so we know the user actively skipped versus hasn't answered yet.
 * Normalise back to the Baby shape when persisting.
 */
export const normalizeSexForBaby = (
  s?: Sex,
): 'girl' | 'boy' | undefined => (s === 'girl' || s === 'boy' ? s : undefined);

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export const computePrematureWeeks = (
  dob: string,
  dueDate?: string,
): number | undefined => {
  if (!dueDate) return undefined;
  const dobMs = new Date(dob).getTime();
  const dueMs = new Date(dueDate).getTime();
  if (Number.isNaN(dobMs) || Number.isNaN(dueMs)) return undefined;
  const diff = dueMs - dobMs;
  if (diff <= 0) return undefined;
  const weeks = Math.round(diff / MS_PER_WEEK);
  return weeks > 0 ? weeks : undefined;
};
