export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  amount: number;
  currency: string;
  recipient?: string;
  sender?: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  icon: string;
  note?: string;
}

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  email: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  spent: number;
  budget: number;
}

export interface MonthlySpendingDatum {
  month: string;
  amount: number;
}

export interface CategorySpendingDatum {
  name: string;
  value: number;
  color: string;
}
