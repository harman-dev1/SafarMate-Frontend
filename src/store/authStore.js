import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        if (token) localStorage.setItem('safarmate_token', token);
        set({ user, token });
      },
      clearAuth: () => {
        localStorage.removeItem('safarmate_token');
        set({ user: null, token: null });
      },
    }),
    { name: 'safarmate-auth' }
  )
);