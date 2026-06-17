import { create } from 'zustand';
import { getMe, postLogin, postSignup } from '@/api/command';
import type { MeResponse } from '@/api/types';
import { getMockUser, getToken, isMockToken, setMockUser, setToken } from '@/utils/auth';

type AuthState = {
  user: MeResponse | null;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  refresh: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  setLoading: (loading) => set({ loading }),

  refresh: async () => {
    const token = getToken();
    if (!token) {
      set({ user: null });
      return;
    }

    const mockMode = import.meta.env.VITE_USE_MOCK === 'true';
    const cachedMockUser = mockMode && isMockToken(token) ? getMockUser() : null;
    if (cachedMockUser) {
      set({ user: cachedMockUser });
    }

    try {
      const me = await getMe();
      set({ user: me });
      if (mockMode && isMockToken(token)) {
        setMockUser({ id: me.id, username: me.username });
      }
    } catch {
      if (cachedMockUser) {
        set({ user: cachedMockUser });
        return;
      }
      setToken(null);
      set({ user: null });
    }
  },

  login: async (username, password) => {
    const res = await postLogin(username, password);
    setToken(res.token);
    const user = { id: res.userId, username: res.username };
    set({ user });
    if (isMockToken(res.token)) {
      setMockUser(user);
    }
  },

  signup: async (username, password) => {
    const res = await postSignup(username, password);
    setToken(res.token);
    const user = { id: res.userId, username: res.username };
    set({ user });
    if (isMockToken(res.token)) {
      setMockUser(user);
    }
  },

  logout: () => {
    setToken(null);
    set({ user: null });
  },
}));
