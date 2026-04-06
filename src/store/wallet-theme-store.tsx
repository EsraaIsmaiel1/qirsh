import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo, useEffect, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import {
  THEME_STORAGE_KEY,
  type ColorScheme,
  buildNavigationTheme,
  getWalletPalette,
} from '@/src/utils/wallet-theme';

type WalletThemeState = {
  scheme: ColorScheme;
  isReady: boolean;
  syncFromStorage: (systemScheme: ColorScheme | null | undefined) => Promise<void>;
  setScheme: (s: ColorScheme) => Promise<void>;
  toggleTheme: () => void;
};

export const useWalletThemeStore = create<WalletThemeState>((set, get) => ({
  scheme: 'light',
  isReady: false,
  syncFromStorage: async (systemScheme) => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      let next: ColorScheme = 'light';
      if (saved === 'light' || saved === 'dark') {
        next = saved;
      } else if (systemScheme === 'dark' || systemScheme === 'light') {
        next = systemScheme;
      }
      set({ scheme: next, isReady: true });
    } catch {
      set({ isReady: true });
    }
  },
  setScheme: async (s) => {
    set({ scheme: s });
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, s);
    } catch {
      /* ignore */
    }
  },
  toggleTheme: () => {
    const next: ColorScheme = get().scheme === 'light' ? 'dark' : 'light';
    void get().setScheme(next);
  },
}));

export function WalletThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const syncFromStorage = useWalletThemeStore((s) => s.syncFromStorage);

  useEffect(() => {
    void syncFromStorage(systemScheme);
  }, [systemScheme, syncFromStorage]);

  return <>{children}</>;
}

export function useWalletTheme() {
  const { scheme, isReady, setScheme, toggleTheme } = useWalletThemeStore(
    useShallow((s) => ({
      scheme: s.scheme,
      isReady: s.isReady,
      setScheme: s.setScheme,
      toggleTheme: s.toggleTheme,
    }))
  );

  const palette = useMemo(() => getWalletPalette(scheme), [scheme]);
  const navigationTheme = useMemo(() => buildNavigationTheme(scheme, palette), [scheme, palette]);

  return {
    scheme,
    palette,
    navigationTheme,
    isReady,
    setScheme,
    toggleTheme,
  };
}
