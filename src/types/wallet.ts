export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionDirection = 'in' | 'out';
export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  type: TransactionType;
  /** 'in' adds to the wallet, 'out' takes from it. Transfers can be either. */
  direction: TransactionDirection;
  amountCents: number;
  currency: string;
  category: string;
  icon: string;
  recipient?: string;
  sender?: string;
  date: string;
  status: TransactionStatus;
  note?: string;
  /** false when the row was only logged for tracking (e.g. a cash expense). */
  affectsBalance: boolean;
  balanceAfterCents?: number;
}

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  walletTag: string;
  preferredCurrency: 'EGP' | 'USD';
}

export interface Wallet {
  id: string;
  currency: string;
  balanceCents: number;
}

/** Someone you can send money to. */
export interface Contact {
  id: string;
  name: string;
  walletTag: string;
  avatar: string;
  nickname?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  /** Spent this calendar month. */
  spentCents: number;
  /** Monthly budget, or null if the user hasn't set one. */
  budgetCents: number | null;
}

export interface MonthlyTotal {
  /** First day of the month, YYYY-MM-DD. */
  month: string;
  inCents: number;
  outCents: number;
  expenseCents: number;
}
