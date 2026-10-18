import { create } from 'zustand';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SessionStore {
  user: SessionUser | null;
  loaded: boolean;
  fetchUser: () => Promise<void>;
  clearUser: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  user: null,
  loaded: false,
  fetchUser: async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.status === 401 && typeof window !== 'undefined') {
        set({ user: null, loaded: true });
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      set({ user: data.user ?? null, loaded: true });
    } catch {
      set({ user: null, loaded: true });
    }
  },
  clearUser: () => set({ user: null, loaded: false }),
}));
