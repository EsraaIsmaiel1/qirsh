-- =============================================================================
-- Pay Wallet: core schema, row-level security and money-movement functions
-- =============================================================================
-- Design rules:
--   * Money is stored as whole piastres/cents in BIGINT (never float).
--   * The app can READ its own rows but can never write balances or
--     transactions directly. All money movement goes through the
--     SECURITY DEFINER functions at the bottom, which lock rows and run in
--     a single transaction.
--   * Every table has RLS enabled. anon gets nothing.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.transaction_type      as enum ('income', 'expense', 'transfer');
create type public.transaction_direction as enum ('in', 'out');
create type public.transaction_status    as enum ('pending', 'completed', 'failed');
create type public.category_kind         as enum ('expense', 'income');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  full_name          text not null default '' check (char_length(full_name) <= 100),
  email              text not null,
  -- Public handle people use to pay you (shown on the Receive screen / QR).
  wallet_tag         text not null unique check (wallet_tag ~ '^[a-z0-9_]{4,32}$'),
  avatar_url         text,
  preferred_currency text not null default 'EGP' check (preferred_currency in ('EGP', 'USD')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create unique index profiles_email_lower_idx on public.profiles (lower(email));

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- wallets: one per user for now (unique user_id); balance can never go negative
-- ---------------------------------------------------------------------------
create table public.wallets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references public.profiles (id) on delete cascade,
  currency      text not null default 'EGP' check (currency in ('EGP', 'USD')),
  balance_cents bigint not null default 0 check (balance_cents >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger wallets_set_updated_at
  before update on public.wallets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- categories: built-in (user_id is null) + user-defined
-- ---------------------------------------------------------------------------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles (id) on delete cascade,
  kind       public.category_kind not null default 'expense',
  name       text not null check (char_length(name) between 1 and 40),
  icon       text not null default 'tag',
  color      text not null default '#6366f1' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now()
);

create unique index categories_unique_name_idx
  on public.categories (coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), kind, lower(name));

-- ---------------------------------------------------------------------------
-- budgets: a user's monthly limit per category
-- ---------------------------------------------------------------------------
create table public.budgets (
  user_id             uuid not null references public.profiles (id) on delete cascade,
  category_id         uuid not null references public.categories (id) on delete cascade,
  monthly_limit_cents bigint not null check (monthly_limit_cents >= 0),
  updated_at          timestamptz not null default now(),
  primary key (user_id, category_id)
);

create trigger budgets_set_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- transactions: append-only ledger. A transfer creates TWO rows (out + in)
-- linked by transfer_group.
-- ---------------------------------------------------------------------------
create table public.transactions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles (id) on delete cascade,
  wallet_id            uuid not null references public.wallets (id) on delete cascade,
  type                 public.transaction_type not null,
  direction            public.transaction_direction not null,
  amount_cents         bigint not null check (amount_cents > 0),
  currency             text not null default 'EGP',
  category_id          uuid references public.categories (id) on delete set null,
  counterparty_user_id uuid references public.profiles (id) on delete set null,
  counterparty_name    text,
  note                 text check (char_length(note) <= 280),
  status               public.transaction_status not null default 'completed',
  -- false = logged for tracking only (e.g. a cash expense), wallet untouched
  affects_balance      boolean not null default true,
  balance_after_cents  bigint,
  transfer_group       uuid,
  -- client-generated key so a double-tap / retry can't charge twice
  idempotency_key      uuid,
  created_at           timestamptz not null default now(),
  constraint transactions_direction_matches_type check (
    (type = 'income'  and direction = 'in')  or
    (type = 'expense' and direction = 'out') or
    (type = 'transfer')
  )
);

create index transactions_user_created_idx on public.transactions (user_id, created_at desc);
create index transactions_transfer_group_idx on public.transactions (transfer_group) where transfer_group is not null;
create unique index transactions_idempotency_idx
  on public.transactions (user_id, idempotency_key) where idempotency_key is not null;

-- ---------------------------------------------------------------------------
-- contacts: people a user has saved / sent money to
-- ---------------------------------------------------------------------------
create table public.contacts (
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  contact_id uuid not null references public.profiles (id) on delete cascade,
  nickname   text check (char_length(nickname) <= 60),
  created_at timestamptz not null default now(),
  primary key (owner_id, contact_id),
  check (owner_id <> contact_id)
);

-- =============================================================================
-- Row-level security
-- =============================================================================
alter table public.profiles     enable row level security;
alter table public.wallets      enable row level security;
alter table public.categories   enable row level security;
alter table public.budgets      enable row level security;
alter table public.transactions enable row level security;
alter table public.contacts     enable row level security;

revoke all on public.profiles, public.wallets, public.categories,
              public.budgets, public.transactions, public.contacts from anon;

-- profiles: read own; update only safe columns
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, avatar_url, preferred_currency) on public.profiles to authenticated;

-- wallets: read-only for the owner. Balance changes only via functions below.
create policy "wallets: read own" on public.wallets
  for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete on public.wallets from authenticated;
grant select on public.wallets to authenticated;

-- categories: see built-ins + own; manage own
create policy "categories: read built-in and own" on public.categories
  for select to authenticated using (user_id is null or user_id = (select auth.uid()));
create policy "categories: insert own" on public.categories
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "categories: update own" on public.categories
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "categories: delete own" on public.categories
  for delete to authenticated using (user_id = (select auth.uid()));
grant select, insert, update, delete on public.categories to authenticated;

-- budgets: full control of own rows, on categories the user can see
create policy "budgets: manage own" on public.budgets
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.categories c
      where c.id = category_id and (c.user_id is null or c.user_id = (select auth.uid()))
    )
  );
grant select, insert, update, delete on public.budgets to authenticated;

-- transactions: read-only ledger for the owner
create policy "transactions: read own" on public.transactions
  for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete on public.transactions from authenticated;
grant select on public.transactions to authenticated;

-- contacts: manage own list
create policy "contacts: read own" on public.contacts
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "contacts: insert own" on public.contacts
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "contacts: update own" on public.contacts
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "contacts: delete own" on public.contacts
  for delete to authenticated using (owner_id = (select auth.uid()));
grant select, insert, update, delete on public.contacts to authenticated;

-- =============================================================================
-- New user -> profile + wallet
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_base text;
  v_tag  text;
begin
  v_base := left(regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9_]', '', 'g'), 20);
  if char_length(v_base) < 3 then
    v_base := 'user';
  end if;

  loop
    v_tag := v_base || '_' || lpad(floor(random() * 10000)::int::text, 4, '0');
    exit when not exists (select 1 from public.profiles where wallet_tag = v_tag);
  end loop;

  insert into public.profiles (id, full_name, email, wallet_tag)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), ''), 100),
    lower(new.email),
    v_tag
  );

  insert into public.wallets (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Money movement (the ONLY way balances/transactions change)
-- Errors are raised with a stable snake_case message the app can map:
--   not_authenticated, invalid_amount, amount_exceeds_limit, daily_limit_exceeded,
--   note_too_long, cannot_send_to_self, recipient_not_found, currency_mismatch,
--   insufficient_funds, category_not_found, wallet_not_found
-- =============================================================================

-- Limits (placeholders: tune to your product / regulatory requirements).
create or replace function public.wallet_limits(
  out max_per_transfer_cents bigint,
  out max_daily_out_cents    bigint
)
language sql
immutable
set search_path = ''
as $$
  select 5000000::bigint,   -- 50,000.00 per transfer
         10000000::bigint;  -- 100,000.00 sent per rolling 24h
$$;

-- Look up a recipient by exact wallet tag or exact email.
-- Exact match only, so the endpoint can't be used to list users.
create or replace function public.find_recipient(p_query text)
returns table (id uuid, full_name text, wallet_tag text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_q   text := lower(trim(coalesce(p_query, '')));
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  return query
    select p.id, p.full_name, p.wallet_tag
    from public.profiles p
    where (p.wallet_tag = v_q or lower(p.email) = v_q)
      and p.id <> v_uid
    limit 1;
end;
$$;

-- Atomic wallet-to-wallet transfer. Returns the sender's transaction id.
create or replace function public.send_money(
  p_recipient_id    uuid,
  p_amount_cents    bigint,
  p_note            text default null,
  p_idempotency_key uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid        uuid := auth.uid();
  v_limits     record;
  v_existing   uuid;
  v_from       public.wallets%rowtype;
  v_to         public.wallets%rowtype;
  v_sent_24h   bigint;
  v_from_bal   bigint;
  v_to_bal     bigint;
  v_group      uuid := gen_random_uuid();
  v_from_name  text;
  v_to_name    text;
  v_note       text := nullif(trim(coalesce(p_note, '')), '');
  v_tx_id      uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_amount_cents is null or p_amount_cents <= 0 then raise exception 'invalid_amount'; end if;
  if char_length(v_note) > 280 then raise exception 'note_too_long'; end if;
  if p_recipient_id is null or p_recipient_id = v_uid then raise exception 'cannot_send_to_self'; end if;

  select * into v_limits from public.wallet_limits();
  if p_amount_cents > v_limits.max_per_transfer_cents then
    raise exception 'amount_exceeds_limit';
  end if;

  -- Retry of a request that already succeeded: return the original result.
  if p_idempotency_key is not null then
    select t.id into v_existing
    from public.transactions t
    where t.user_id = v_uid and t.idempotency_key = p_idempotency_key;
    if found then return v_existing; end if;
  end if;

  -- Lock both wallets in a fixed order (by id) to avoid deadlocks.
  perform 1 from public.wallets w
  where w.user_id in (v_uid, p_recipient_id)
  order by w.id
  for update;

  select * into v_from from public.wallets where user_id = v_uid;
  if not found then raise exception 'wallet_not_found'; end if;

  select * into v_to from public.wallets where user_id = p_recipient_id;
  if not found then raise exception 'recipient_not_found'; end if;

  if v_from.currency <> v_to.currency then raise exception 'currency_mismatch'; end if;

  select coalesce(sum(t.amount_cents), 0) into v_sent_24h
  from public.transactions t
  where t.wallet_id = v_from.id
    and t.direction = 'out'
    and t.affects_balance
    and t.status <> 'failed'
    and t.created_at > now() - interval '24 hours';
  if v_sent_24h + p_amount_cents > v_limits.max_daily_out_cents then
    raise exception 'daily_limit_exceeded';
  end if;

  if v_from.balance_cents < p_amount_cents then raise exception 'insufficient_funds'; end if;

  update public.wallets set balance_cents = balance_cents - p_amount_cents
  where id = v_from.id returning balance_cents into v_from_bal;

  update public.wallets set balance_cents = balance_cents + p_amount_cents
  where id = v_to.id returning balance_cents into v_to_bal;

  select full_name into v_from_name from public.profiles where id = v_uid;
  select full_name into v_to_name   from public.profiles where id = p_recipient_id;

  insert into public.transactions (
    user_id, wallet_id, type, direction, amount_cents, currency,
    counterparty_user_id, counterparty_name, note, balance_after_cents,
    transfer_group, idempotency_key
  ) values (
    v_uid, v_from.id, 'transfer', 'out', p_amount_cents, v_from.currency,
    p_recipient_id, v_to_name, v_note, v_from_bal,
    v_group, p_idempotency_key
  ) returning id into v_tx_id;

  insert into public.transactions (
    user_id, wallet_id, type, direction, amount_cents, currency,
    counterparty_user_id, counterparty_name, note, balance_after_cents, transfer_group
  ) values (
    p_recipient_id, v_to.id, 'transfer', 'in', p_amount_cents, v_to.currency,
    v_uid, v_from_name, v_note, v_to_bal, v_group
  );

  -- Remember the recipient for next time.
  insert into public.contacts (owner_id, contact_id)
  values (v_uid, p_recipient_id)
  on conflict do nothing;

  return v_tx_id;
end;
$$;

-- Log an expense. By default it is paid from the wallet (balance goes down);
-- pass p_deduct_from_wallet => false to only track it (e.g. paid in cash).
create or replace function public.add_expense(
  p_amount_cents       bigint,
  p_category_id        uuid,
  p_note               text default null,
  p_deduct_from_wallet boolean default true,
  p_idempotency_key    uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := auth.uid();
  v_existing uuid;
  v_wallet   public.wallets%rowtype;
  v_bal      bigint;
  v_note     text := nullif(trim(coalesce(p_note, '')), '');
  v_deduct   boolean := coalesce(p_deduct_from_wallet, true);
  v_tx_id    uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_amount_cents is null or p_amount_cents <= 0 then raise exception 'invalid_amount'; end if;
  if char_length(v_note) > 280 then raise exception 'note_too_long'; end if;

  if not exists (
    select 1 from public.categories c
    where c.id = p_category_id
      and c.kind = 'expense'
      and (c.user_id is null or c.user_id = v_uid)
  ) then
    raise exception 'category_not_found';
  end if;

  if p_idempotency_key is not null then
    select t.id into v_existing
    from public.transactions t
    where t.user_id = v_uid and t.idempotency_key = p_idempotency_key;
    if found then return v_existing; end if;
  end if;

  select * into v_wallet from public.wallets where user_id = v_uid for update;
  if not found then raise exception 'wallet_not_found'; end if;

  if v_deduct then
    if v_wallet.balance_cents < p_amount_cents then raise exception 'insufficient_funds'; end if;
    update public.wallets set balance_cents = balance_cents - p_amount_cents
    where id = v_wallet.id returning balance_cents into v_bal;
  end if;

  insert into public.transactions (
    user_id, wallet_id, type, direction, amount_cents, currency,
    category_id, note, affects_balance, balance_after_cents, idempotency_key
  ) values (
    v_uid, v_wallet.id, 'expense', 'out', p_amount_cents, v_wallet.currency,
    p_category_id, v_note, v_deduct, v_bal, p_idempotency_key
  ) returning id into v_tx_id;

  return v_tx_id;
end;
$$;

-- NOTE: there is deliberately no "add money" function callable by the app.
-- Top-ups must be credited by a trusted backend (Edge Function using the
-- service role) after a payment provider confirms the payment via webhook;
-- otherwise any user could mint balance.

-- =============================================================================
-- Analytics (security invoker: RLS applies, users only see their own data)
-- =============================================================================

-- Spending per expense category in a date range, with the user's budget.
create or replace function public.spending_by_category(
  p_from timestamptz default date_trunc('month', now()),
  p_to   timestamptz default now()
)
returns table (
  category_id  uuid,
  name         text,
  icon         text,
  color        text,
  spent_cents  bigint,
  budget_cents bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select c.id, c.name, c.icon, c.color,
         coalesce(sum(t.amount_cents) filter (
           where t.created_at >= p_from and t.created_at < p_to and t.status = 'completed'
         ), 0)::bigint as spent_cents,
         b.monthly_limit_cents as budget_cents
  from public.categories c
  left join public.transactions t
         on t.category_id = c.id and t.user_id = (select auth.uid()) and t.type = 'expense'
  left join public.budgets b
         on b.category_id = c.id and b.user_id = (select auth.uid())
  where c.kind = 'expense'
  group by c.id, c.name, c.icon, c.color, b.monthly_limit_cents
  order by spent_cents desc, c.name;
$$;

-- Money in / out per calendar month for the last N months (including this one).
create or replace function public.monthly_totals(p_months int default 6)
returns table (month date, in_cents bigint, out_cents bigint, expense_cents bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  with months as (
    select generate_series(
      date_trunc('month', now()) - make_interval(months => greatest(least(p_months, 24), 1) - 1),
      date_trunc('month', now()),
      interval '1 month'
    )::date as month
  )
  select m.month,
         coalesce(sum(t.amount_cents) filter (where t.direction = 'in'),  0)::bigint,
         coalesce(sum(t.amount_cents) filter (where t.direction = 'out'), 0)::bigint,
         coalesce(sum(t.amount_cents) filter (where t.type = 'expense'),  0)::bigint
  from months m
  left join public.transactions t
         on date_trunc('month', t.created_at)::date = m.month
        and t.user_id = (select auth.uid())
        and t.status = 'completed'
  group by m.month
  order by m.month;
$$;

-- =============================================================================
-- Function permissions
-- =============================================================================
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function
  public.find_recipient(text),
  public.send_money(uuid, bigint, text, uuid),
  public.add_expense(bigint, uuid, text, boolean, uuid),
  public.spending_by_category(timestamptz, timestamptz),
  public.monthly_totals(int),
  public.wallet_limits()
from public, anon;
grant execute on function
  public.find_recipient(text),
  public.send_money(uuid, bigint, text, uuid),
  public.add_expense(bigint, uuid, text, boolean, uuid),
  public.spending_by_category(timestamptz, timestamptz),
  public.monthly_totals(int),
  public.wallet_limits()
to authenticated;

-- =============================================================================
-- Realtime: live balance + new transactions (RLS still applies)
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.wallets, public.transactions;
  end if;
end;
$$;

-- =============================================================================
-- Built-in categories (match the app's current mock data)
-- =============================================================================
insert into public.categories (user_id, kind, name, icon, color) values
  (null, 'expense', 'Groceries',      'shopping-cart', '#10b981'),
  (null, 'expense', 'Transportation', 'car',           '#3b82f6'),
  (null, 'expense', 'Dining',         'utensils',      '#f59e0b'),
  (null, 'expense', 'Shopping',       'shopping-bag',  '#ec4899'),
  (null, 'expense', 'Bills',          'zap',           '#ef4444'),
  (null, 'expense', 'Entertainment',  'ticket',        '#8b5cf6'),
  (null, 'expense', 'Health',         'heart-pulse',   '#14b8a6'),
  (null, 'expense', 'Education',      'book-open',     '#6366f1'),
  (null, 'income',  'Salary',         'briefcase',     '#10b981'),
  (null, 'income',  'Freelance',      'laptop',        '#22c55e'),
  (null, 'income',  'Other',          'plus',          '#64748b');
