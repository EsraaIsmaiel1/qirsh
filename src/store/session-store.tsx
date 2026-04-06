import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, type ReactNode } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

const SESSION_KEY = '@paywallet/session';

type SessionState = {
  isReady: boolean;
  isSignedIn: boolean;
  hydrate: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useSessionStore = create<SessionState>((set) => ({
  isReady: false,
  isSignedIn: false,
  hydrate: async () => {
    try {
      const v = await AsyncStorage.getItem(SESSION_KEY);
      set({ isSignedIn: v === '1', isReady: true });
    } catch {
      set({ isSignedIn: false, isReady: true });
    }
  },
  signIn: async () => {
    await AsyncStorage.setItem(SESSION_KEY, '1');
    set({ isSignedIn: true });
  },
  signOut: async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    set({ isSignedIn: false });
  },
}));

export function SessionProvider({ children }: { children: ReactNode }) {
  const hydrate = useSessionStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return <>{children}</>;
}

export function useSession() {
  return useSessionStore(
    useShallow((s) => ({
      isReady: s.isReady,
      isSignedIn: s.isSignedIn,
      signIn: s.signIn,
      signOut: s.signOut,
    }))
  );
}
