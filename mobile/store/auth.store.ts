import { create } from 'zustand';
import { User, AuthTokens } from '@/types/auth.types';
import { storage } from '@/utils/storage';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  setUser: (user: User, tokens: AuthTokens) => void;
  clearAuth: () => void;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  isLoading: true,

  setUser: (user, tokens) => {
    set({ user, tokens });
    storage.set('user', JSON.stringify(user));
    storage.set('tokens', JSON.stringify(tokens));
  },

  clearAuth: () => {
    set({ user: null, tokens: null });
    storage.delete('user');
    storage.delete('tokens');
  },

  loadFromStorage: async () => {
    const userStr = await storage.getString('user');
    const tokensStr = await storage.getString('tokens');
    if (userStr && tokensStr) {
      set({ user: JSON.parse(userStr), tokens: JSON.parse(tokensStr) });
    }
    set({ isLoading: false });
  },
}));
