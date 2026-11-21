import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import {
  addExpense,
  countTransactions,
  findRecipient,
  getMonthlyTotals,
  getProfile,
  getTransaction,
  getWallet,
  listContacts,
  listExpenseCategories,
  listTransactions,
  sendMoney,
  type TransactionFilter,
} from '@/src/services/wallet-api';
import { getSecurityStatus } from '@/src/services/security-api';
import { supabase } from '@/src/services/supabase';
import { useSessionStore } from '@/src/store/session-store';

export type { TransactionFilter } from '@/src/services/wallet-api';

/** Query keys. Everything is scoped under ['wallet', userId] so one invalidate refreshes all. */
export const walletKeys = {
  all: (uid: string) => ['wallet', uid] as const,
  profile: (uid: string) => ['wallet', uid, 'profile'] as const,
  balance: (uid: string) => ['wallet', uid, 'balance'] as const,
  transactions: (uid: string, filter: TransactionFilter, limit: number) =>
    ['wallet', uid, 'transactions', filter, limit] as const,
  transaction: (uid: string, id: string) => ['wallet', uid, 'transaction', id] as const,
  transactionCount: (uid: string) => ['wallet', uid, 'transaction-count'] as const,
  contacts: (uid: string) => ['wallet', uid, 'contacts'] as const,
  categories: (uid: string) => ['wallet', uid, 'categories'] as const,
  monthly: (uid: string, months: number) => ['wallet', uid, 'monthly', months] as const,
  security: (uid: string) => ['wallet', uid, 'security'] as const,
};

function useUserId(): string {
  // Screens using these hooks are only mounted inside the signed-in (app) stack.
  return useSessionStore((s) => s.session?.user.id ?? '');
}

export function useProfile() {
  const uid = useUserId();
  return useQuery({
    queryKey: walletKeys.profile(uid),
    queryFn: () => getProfile(uid),
    enabled: !!uid,
  });
}

export function useWallet() {
  const uid = useUserId();
  return useQuery({
    queryKey: walletKeys.balance(uid),
    queryFn: () => getWallet(uid),
    enabled: !!uid,
  });
}

export function useTransactions(filter: TransactionFilter = 'all', limit = 100) {
  const uid = useUserId();
  return useQuery({
    queryKey: walletKeys.transactions(uid, filter, limit),
    queryFn: () => listTransactions(uid, { filter, limit }),
    enabled: !!uid,
  });
}

export function useRecentTransactions(limit = 5) {
  return useTransactions('all', limit);
}

export function useTransactionById(id?: string | string[]) {
  const uid = useUserId();
  const transactionId = (Array.isArray(id) ? id[0] : id) ?? '';
  return useQuery({
    queryKey: walletKeys.transaction(uid, transactionId),
    queryFn: () => getTransaction(transactionId),
    enabled: !!uid && !!transactionId,
  });
}

export function useTransactionCount() {
  const uid = useUserId();
  return useQuery({
    queryKey: walletKeys.transactionCount(uid),
    queryFn: () => countTransactions(uid),
    enabled: !!uid,
  });
}

export function useContacts() {
  const uid = useUserId();
  return useQuery({
    queryKey: walletKeys.contacts(uid),
    queryFn: listContacts,
    enabled: !!uid,
  });
}

export function useExpenseCategories() {
  const uid = useUserId();
  return useQuery({
    queryKey: walletKeys.categories(uid),
    queryFn: listExpenseCategories,
    enabled: !!uid,
  });
}

export function useMonthlyTotals(months = 6) {
  const uid = useUserId();
  return useQuery({
    queryKey: walletKeys.monthly(uid, months),
    queryFn: () => getMonthlyTotals(months),
    enabled: !!uid,
  });
}

export function useSecurityStatus() {
  const uid = useUserId();
  return useQuery({
    queryKey: walletKeys.security(uid),
    queryFn: getSecurityStatus,
    enabled: !!uid,
  });
}

export function useFindRecipient() {
  return useMutation({ mutationFn: findRecipient });
}

/** Refreshes every wallet query for the signed-in user. */
export function useRefreshWallet() {
  const uid = useUserId();
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: walletKeys.all(uid) });
}

export function useSendMoney() {
  const refresh = useRefreshWallet();
  return useMutation({ mutationFn: sendMoney, onSettled: refresh });
}

export function useAddExpense() {
  const refresh = useRefreshWallet();
  return useMutation({ mutationFn: addExpense, onSettled: refresh });
}

/**
 * Listens for balance / transaction changes (e.g. money received from someone
 * else) and refreshes the cached data. Mount once inside the signed-in area.
 */
export function useWalletRealtime() {
  const uid = useUserId();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!uid) return;
    const refresh = () => queryClient.invalidateQueries({ queryKey: walletKeys.all(uid) });

    const channel = supabase
      .channel(`wallet-${uid}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${uid}` },
        refresh
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions', filter: `user_id=eq.${uid}` },
        refresh
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [uid, queryClient]);
}
