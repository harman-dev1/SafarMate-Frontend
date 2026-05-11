import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'system', // 'light' | 'dark' | 'system'
      setTheme: (t) => set({ theme: t }),
      toggle: () => {
        const cur = get().theme;
        const next = cur === 'dark' ? 'light' : cur === 'light' ? 'dark' : 'light';
        set({ theme: next });
      },
    }),
    { name: 'safarmate-theme' }
  )
);