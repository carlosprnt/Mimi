import { create } from 'zustand';

interface MenuStore {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
}

export const useMenuStore = create<MenuStore>((set) => ({
  open: false,
  setOpen: (v) => set({ open: v }),
  toggle: () => set((s) => ({ open: !s.open })),
}));
