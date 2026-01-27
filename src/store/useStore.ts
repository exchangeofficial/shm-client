import { create } from 'zustand';

interface MenuItem {
  id: string;
  label: string;
  path: string;
  enabled: boolean;
}

interface ThemeConfig {
  primaryColor: string;
  allowUserThemeChange: boolean;
}

interface User {
  user_id: number;
  login: string;
  gid?: number;
  full_name?: string;
  phone?: string;
  balance?: number;
  bonus?: number;
  credit?: number;
  discount?: number;
}

interface AppState {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // UI state
  menuItems: MenuItem[];
  themeConfig: ThemeConfig;
  isAdmin: boolean;
  telegramPhoto: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setIsAuthenticated: (auth: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setMenuItems: (items: MenuItem[]) => void;
  setThemeConfig: (config: ThemeConfig) => void;
  setIsAdmin: (admin: boolean) => void;
  setTelegramPhoto: (photo: string | null) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Auth state
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading to check auth

  // UI state
  menuItems: [
    { id: '1', label: 'Главная', path: '/', enabled: true },
    { id: '2', label: 'Услуги', path: '/services', enabled: true },
    { id: '3', label: 'Платежи', path: '/payments', enabled: true },
    { id: '4', label: 'Списания', path: '/withdrawals', enabled: true },
  ],
  themeConfig: { primaryColor: '#228be6', allowUserThemeChange: true },
  isAdmin: false,
  telegramPhoto: localStorage.getItem('shm_telegram_photo'),

  // Actions
  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
    isAdmin: user?.gid === 1
  }),
  setIsAuthenticated: (auth) => set({ isAuthenticated: auth }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setMenuItems: (items) => set({ menuItems: items }),
  setThemeConfig: (config) => set({ themeConfig: config }),
  setIsAdmin: (admin) => set({ isAdmin: admin }),
  setTelegramPhoto: (photo) => {
    if (photo) {
      localStorage.setItem('shm_telegram_photo', photo);
    } else {
      localStorage.removeItem('shm_telegram_photo');
    }
    set({ telegramPhoto: photo });
  },
  logout: () => {
    localStorage.removeItem('shm_telegram_photo');
    set({ user: null, isAuthenticated: false, isAdmin: false, telegramPhoto: null });
  },
}));