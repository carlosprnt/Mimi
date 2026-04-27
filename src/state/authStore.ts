import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mimiStorage } from './persist';

export type AuthProvider = 'google' | 'apple';

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
  provider: AuthProvider;
}

interface AuthState {
  user: AuthUser | null;
  status: 'loading' | 'signed-out' | 'signed-in';
  hydrated: boolean;
  signIn: (user: AuthUser) => void;
  signOut: () => void;
  markHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      status: 'loading',
      hydrated: false,
      signIn: (user) => set({ user, status: 'signed-in' }),
      signOut: () => set({ user: null, status: 'signed-out' }),
      markHydrated: () =>
        set((s) => ({
          hydrated: true,
          status: s.user ? 'signed-in' : 'signed-out',
        })),
    }),
    {
      name: 'mimi-auth',
      storage: mimiStorage,
      version: 1,
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);
