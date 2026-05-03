import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mimiStorage } from './persist';

const ADMIN_EMAILS = new Set(['carlosprnt@gmail.com']);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase());
}

interface AdminState {
  demoMode: boolean;
  setDemoMode: (value: boolean) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      demoMode: false,
      setDemoMode: (value) => set({ demoMode: value }),
    }),
    {
      name: 'mimi-admin',
      storage: mimiStorage,
      version: 1,
    },
  ),
);
