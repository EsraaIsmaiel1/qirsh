import { useMemo } from 'react';

import {
  categorySpending,
  contacts,
  expenseCategories,
  monthlySpending,
  transactions,
} from '@/src/services/mock-wallet-data';
import type { Transaction } from '@/src/types/wallet';

type TransactionFilter = Transaction['type'] | 'all';

export function useTransactions(filter: TransactionFilter = 'all') {
  return useMemo(() => {
    if (filter === 'all') {
      return transactions;
    }

    return transactions.filter((transaction) => transaction.type === filter);
  }, [filter]);
}

export function useRecentTransactions(limit = 5) {
  return useMemo(() => transactions.slice(0, limit), [limit]);
}

export function useTransactionById(id?: string | string[]) {
  const transactionId = Array.isArray(id) ? id[0] : id;

  return useMemo(
    () => transactions.find((transaction) => transaction.id === transactionId),
    [transactionId]
  );
}

export function useContacts() {
  return contacts;
}

export function useExpenseCategories() {
  return expenseCategories;
}

export function useAnalyticsData() {
  const totalExpenses = useMemo(
    () => categorySpending.reduce((sum, category) => sum + category.value, 0),
    []
  );

  return {
    categorySpending,
    monthlySpending,
    totalExpenses,
  };
}
