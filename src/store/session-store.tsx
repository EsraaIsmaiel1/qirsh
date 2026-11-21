import { AuthError, type Session } from '@supabase/supabase-js';
import { useEffect, type ReactNode } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { queryClient } from '../services/query-client';
import { supabase } from '../services/supabase';

export type SignUpResult = {
  /** True when Supabase requires the user to confirm their email before a session exists. */
  needsEmailConfirmation: boolean;
};

type SessionState = {
  isReady: boolean;
  isSignedIn: boolean;
  session: Session | null;
  hydrate: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
};

/** Turns Supabase auth errors into short messages that are safe to show the user. */
export function authErrorMessage(error: unknown): string {
  if (error instanceof AuthError) {
    const msg = error.message.toLowerCase();
    if (msg.includes('invalid login credentials')) return 'Incorrect email or password.';
    if (msg.includes('email not confirmed')) return 'Please confirm your email before signing in.';
    if (msg.includes('already registered')) return 'An account with this email already exists.';
    if (msg.includes('password')) return error.message;
    if (error.status === 429) return 'Too many attempts. Please wait a moment and try again.';
    return error.message;
  }
  if (error instanceof Error && /network|fetch/i.test(error.message)) {
    return 'Network error. Check your connection and try again.';
  }
  return 'Something went wrong. Please try again.';
}

export const useSessionStore = create<SessionState>((set) => ({
  isReady: false,
  isSignedIn: false,
  session: null,
  hydrate: async () => {
    try {
      const { data } = await supabase.auth.getSession();
      set({ session: data.session, isSignedIn: !!data.session, isReady: true });
    } catch {
      set({ session: null, isSignedIn: false, isReady: true });
    }
  },
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    set({ session: data.session, isSignedIn: !!data.session });
  },
  signUp: async (fullName, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      // Read by the handle_new_user() trigger to create the profile + wallet.
      options: { data: { full_name: fullName.trim() } },
    });
    if (error) throw error;
    // With "Confirm email" on, Supabase returns a user but no session.
    set({ session: data.session, isSignedIn: !!data.session });
    return { needsEmailConfirmation: !data.session };
  },
  signOut: async () => {
    await supabase.auth.signOut();
    // Don't leave the previous user's balance/transactions in memory.
    queryClient.clear();
    set({ session: null, isSignedIn: false });
  },
}));

export function SessionProvider({ children }: { children: ReactNode }) {
  const hydrate = useSessionStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) queryClient.clear();
      useSessionStore.setState({ session, isSignedIn: !!session });
    });

    return () => listener.subscription.unsubscribe();
  }, [hydrate]);

  return <>{children}</>;
}

export function useSession() {
  return useSessionStore(
    useShallow((s) => ({
      isReady: s.isReady,
      isSignedIn: s.isSignedIn,
      session: s.session,
      signIn: s.signIn,
      signUp: s.signUp,
      signOut: s.signOut,
    }))
  );
}
