/**
 * All reads/writes to Supabase for wallet data live here.
 * Screens never call supabase directly; they use the hooks in
 * src/hooks/use-wallet-data.ts, which wrap these functions in React Query.
 */
import type { PostgrestError } from '@supabase/supabase-js';

import type {
  Contact,
  ExpenseCategory,
  MonthlyTotal,
  Profile,
  Transaction,
  TransactionDirection,
  TransactionStatus,
  TransactionType,
  Wallet,
} from '@/src/types/wallet';
import { initials } from '@/src/utils/money';

import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** Error codes raised by the database functions (see supabase/migrations). */
const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: 'Your session has expired. Please sign in again.',
  invalid_amount: 'Please enter a valid amount.',
  amount_exceeds_limit: 'This amount is above the per-transfer limit.',
  daily_limit_exceeded: 'You have reached your daily sending limit. Try again tomorrow.',
  note_too_long: 'The note is too long (280 characters max).',
  cannot_send_to_self: "You can't send money to yourself.",
  recipient_not_found: "We couldn't find that recipient.",
  currency_mismatch: "The recipient's wallet uses a different currency.",
  insufficient_funds: "You don't have enough balance for this.",
  category_not_found: 'That category no longer exists.',
  wallet_not_found: "We couldn't find your wallet. Please contact support.",
  authorization_required: 'Please confirm the payment with your PIN again.',
  authorization_expired: 'Your PIN confirmation expired. Please try again.',
  pin_too_weak: 'That PIN is too easy to guess. Choose another one.',
};

export class WalletApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'WalletApiError';
  }
}

function toWalletError(error: PostgrestError | Error): WalletApiError {
  const raw = error.message ?? '';
  const code = Object.keys(ERROR_MESSAGES).find((c) => raw === c || raw.includes(c));
  if (code) return new WalletApiError(ERROR_MESSAGES[code], code);
  if (/network|fetch|timeout/i.test(raw)) {
    return new WalletApiError('Network error. Check your connection and try again.', 'network');
  }
  if (__DEV__) console.warn('[wallet-api]', error);
  return new WalletApiError('Something went wrong. Please try again.');
}

/** Message safe to show the user for any error thrown by this module. */
export function walletErrorMessage(error: unknown): string {
  if (error instanceof WalletApiError) return error.message;
  if (error instanceof Error) return toWalletError(error).message;
  return 'Something went wrong. Please try again.';
}

function check<T>(res: { data: T; error: PostgrestError | null }): T {
  if (res.error) throw toWalletError(res.error);
  return res.data;
}

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

type TransactionRow = {
  id: string;
  type: TransactionType;
  direction: TransactionDirection;
  amount_cents: number;
  currency: string;
  counterparty_name: string | null;
  note: string | null;
  status: TransactionStatus;
  affects_balance: boolean;
  balance_after_cents: number | null;
  created_at: string;
  category: { name: string; icon: string } | null;
};

const TRANSACTION_COLUMNS =
  'id, type, direction, amount_cents, currency, counterparty_name, note, status, ' +
  'affects_balance, balance_after_cents, created_at, category:categories(name, icon)';

function mapTransaction(r: TransactionRow): Transaction {
  const fallbackName =
    r.type === 'transfer' ? 'Transfer' : r.type === 'income' ? 'Income' : 'Expense';
  const fallbackIcon =
    r.type === 'transfer' ? 'arrow-right-left' : r.type === 'income' ? 'plus' : 'tag';
  const counterparty = r.counterparty_name?.trim() || undefined;

  return {
    id: r.id,
    type: r.type,
    direction: r.direction,
    amountCents: Number(r.amount_cents),
    currency: r.currency,
    category: r.category?.name ?? fallbackName,
    icon: r.category?.icon ?? fallbackIcon,
    recipient: r.direction === 'out' ? counterparty : undefined,
    sender: r.direction === 'in' ? counterparty : undefined,
    date: r.created_at,
    status: r.status,
    note: r.note ?? undefined,
    affectsBalance: r.affects_balance,
    balanceAfterCents: r.balance_after_cents == null ? undefined : Number(r.balance_after_cents),
  };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getProfile(userId: string): Promise<Profile> {
  const row = check(
    await supabase
      .from('profiles')
      .select('id, full_name, email, wallet_tag, preferred_currency')
      .eq('id', userId)
      .single()
  ) as {
    id: string;
    full_name: string;
    email: string;
    wallet_tag: string;
    preferred_currency: 'EGP' | 'USD';
  };
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    walletTag: row.wallet_tag,
    preferredCurrency: row.preferred_currency,
  };
}

export async function getWallet(userId: string): Promise<Wallet> {
  const row = check(
    await supabase
      .from('wallets')
      .select('id, currency, balance_cents')
      .eq('user_id', userId)
      .single()
  ) as { id: string; currency: string; balance_cents: number };
  return { id: row.id, currency: row.currency, balanceCents: Number(row.balance_cents) };
}

export type TransactionFilter = 'all' | 'income' | 'expense' | 'transfer';

export async function listTransactions(
  userId: string,
  { filter = 'all', limit = 50 }: { filter?: TransactionFilter; limit?: number } = {}
): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select(TRANSACTION_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (filter !== 'all') query = query.eq('type', filter);

  const rows = check(await query) as unknown as TransactionRow[];
  return rows.map(mapTransaction);
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  const row = check(
    await supabase.from('transactions').select(TRANSACTION_COLUMNS).eq('id', id).maybeSingle()
  ) as unknown as TransactionRow | null;
  return row ? mapTransaction(row) : null;
}

export async function countTransactions(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw toWalletError(error);
  return count ?? 0;
}

export async function listContacts(): Promise<Contact[]> {
  const rows = check(await supabase.rpc('list_contacts')) as {
    id: string;
    full_name: string;
    wallet_tag: string;
    nickname: string | null;
  }[];
  return rows.map((r) => ({
    id: r.id,
    name: r.nickname || r.full_name || `@${r.wallet_tag}`,
    walletTag: r.wallet_tag,
    avatar: initials(r.nickname || r.full_name || r.wallet_tag),
    nickname: r.nickname ?? undefined,
  }));
}

/** Exact match on wallet tag (with or without @) or email. */
export async function findRecipient(query: string): Promise<Contact | null> {
  const q = query.trim().replace(/^@/, '');
  if (!q) return null;
  const rows = check(await supabase.rpc('find_recipient', { p_query: q })) as {
    id: string;
    full_name: string;
    wallet_tag: string;
  }[];
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    name: r.full_name || `@${r.wallet_tag}`,
    walletTag: r.wallet_tag,
    avatar: initials(r.full_name || r.wallet_tag),
  };
}

/** Expense categories with this month's spending and the user's budget. */
export async function listExpenseCategories(): Promise<ExpenseCategory[]> {
  const rows = check(await supabase.rpc('spending_by_category')) as {
    category_id: string;
    name: string;
    icon: string;
    color: string;
    spent_cents: number;
    budget_cents: number | null;
  }[];
  return rows.map((r) => ({
    id: r.category_id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    spentCents: Number(r.spent_cents),
    budgetCents: r.budget_cents == null ? null : Number(r.budget_cents),
  }));
}

export async function getMonthlyTotals(months = 6): Promise<MonthlyTotal[]> {
  const rows = check(await supabase.rpc('monthly_totals', { p_months: months })) as {
    month: string;
    in_cents: number;
    out_cents: number;
    expense_cents: number;
  }[];
  return rows.map((r) => ({
    month: r.month,
    inCents: Number(r.in_cents),
    outCents: Number(r.out_cents),
    expenseCents: Number(r.expense_cents),
  }));
}

// ---------------------------------------------------------------------------
// Writes (money only moves through database functions)
// ---------------------------------------------------------------------------

export async function sendMoney(input: {
  recipientId: string;
  amountCents: number;
  note?: string;
  idempotencyKey: string;
  /** One-time token from verifyPin(). */
  authToken: string;
}): Promise<string> {
  return check(
    await supabase.rpc('send_money', {
      p_recipient_id: input.recipientId,
      p_amount_cents: input.amountCents,
      p_auth_token: input.authToken,
      p_note: input.note?.trim() || null,
      p_idempotency_key: input.idempotencyKey,
    })
  ) as string;
}

export async function addExpense(input: {
  amountCents: number;
  categoryId: string;
  note?: string;
  deductFromWallet: boolean;
  idempotencyKey: string;
  /** Required when deductFromWallet is true. */
  authToken?: string;
}): Promise<string> {
  return check(
    await supabase.rpc('add_expense', {
      p_amount_cents: input.amountCents,
      p_category_id: input.categoryId,
      p_note: input.note?.trim() || null,
      p_deduct_from_wallet: input.deductFromWallet,
      p_idempotency_key: input.idempotencyKey,
      p_auth_token: input.authToken ?? null,
    })
  ) as string;
}
