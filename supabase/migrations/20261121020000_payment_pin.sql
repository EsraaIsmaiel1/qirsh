-- =============================================================================
-- Payment PIN + one-time payment authorization
-- =============================================================================
-- Flow:
--   1. User sets a 6-digit PIN            -> set_pin()   (bcrypt hash stored server-side)
--   2. Before paying, app calls           -> verify_pin() -> returns a one-time token (2 min)
--      (with biometrics on, the phone unlocks the saved PIN and sends it here)
--   3. send_money()/add_expense() require that token and consume it.
-- So a stolen session token alone can't move money without the PIN.
--
-- Wrong PIN: 5 attempts, then the PIN is locked for 15 minutes.
-- verify_pin/set_pin RETURN failures as JSON instead of raising, so the
-- failed-attempt counter is saved (an exception would roll it back).
-- =============================================================================

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table public.user_security (
  user_id         uuid primary key references public.profiles (id) on delete cascade,
  pin_hash        text,
  failed_attempts int not null default 0,
  locked_until    timestamptz,
  pin_updated_at  timestamptz,
  updated_at      timestamptz not null default now()
);

create trigger user_security_set_updated_at
  before update on public.user_security
  for each row execute function public.set_updated_at();

create table public.auth_challenges (
  token_hash text primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

create index auth_challenges_user_idx on public.auth_challenges (user_id, expires_at);

-- Server-only tables: RLS on, no policies, no grants. Only the functions below touch them.
alter table public.user_security   enable row level security;
alter table public.auth_challenges enable row level security;
revoke all on public.user_security, public.auth_challenges from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------
create or replace function public.pin_settings(
  out max_attempts      int,
  out lock_minutes      int,
  out token_ttl_seconds int
)
language sql
immutable
set search_path = ''
as $$
  select 5, 15, 120;
$$;

-- 6 digits, not all the same digit, not a straight run like 123456 / 654321.
create or replace function public.pin_is_weak(p_pin text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_pin is null
      or p_pin !~ '^[0-9]{6}$'
      or p_pin ~ '^([0-9])\1{5}$'
      or position(p_pin in '01234567890') > 0
      or position(p_pin in '09876543210') > 0;
$$;

-- ---------------------------------------------------------------------------
-- Internal: check a PIN and update the counters. Never raises for a wrong PIN.
-- ---------------------------------------------------------------------------
create or replace function public._check_pin(p_uid uuid, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sec      public.user_security%rowtype;
  v_settings record;
  v_attempts int;
begin
  select * into v_settings from public.pin_settings();

  select * into v_sec from public.user_security where user_id = p_uid for update;
  if not found or v_sec.pin_hash is null then
    return jsonb_build_object('ok', false, 'error', 'pin_not_set');
  end if;

  if v_sec.locked_until is not null and v_sec.locked_until > now() then
    return jsonb_build_object('ok', false, 'error', 'pin_locked', 'locked_until', v_sec.locked_until);
  end if;

  if p_pin is not null and p_pin ~ '^[0-9]{6}$'
     and extensions.crypt(p_pin, v_sec.pin_hash) = v_sec.pin_hash then
    update public.user_security
       set failed_attempts = 0, locked_until = null
     where user_id = p_uid;
    return jsonb_build_object('ok', true);
  end if;

  v_attempts := v_sec.failed_attempts + 1;
  if v_attempts >= v_settings.max_attempts then
    update public.user_security
       set failed_attempts = 0,
           locked_until = now() + make_interval(mins => v_settings.lock_minutes)
     where user_id = p_uid
     returning locked_until into v_sec.locked_until;
    return jsonb_build_object('ok', false, 'error', 'pin_locked', 'locked_until', v_sec.locked_until);
  end if;

  update public.user_security set failed_attempts = v_attempts where user_id = p_uid;
  return jsonb_build_object(
    'ok', false,
    'error', 'pin_incorrect',
    'attempts_left', v_settings.max_attempts - v_attempts
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- App-callable
-- ---------------------------------------------------------------------------
create or replace function public.security_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_sec public.user_security%rowtype;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select * into v_sec from public.user_security where user_id = v_uid;
  return jsonb_build_object(
    'has_pin', coalesce(v_sec.pin_hash is not null, false),
    'locked_until', case when v_sec.locked_until > now() then v_sec.locked_until end
  );
end;
$$;

-- Set the first PIN (p_current_pin null) or change it (current PIN required).
create or replace function public.set_pin(p_new_pin text, p_current_pin text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_has   boolean;
  v_check jsonb;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if public.pin_is_weak(p_new_pin) then raise exception 'pin_too_weak'; end if;

  select pin_hash is not null into v_has from public.user_security where user_id = v_uid;

  if coalesce(v_has, false) then
    v_check := public._check_pin(v_uid, p_current_pin);
    if not (v_check ->> 'ok')::boolean then
      return v_check;
    end if;
  end if;

  insert into public.user_security (user_id, pin_hash, failed_attempts, locked_until, pin_updated_at)
  values (v_uid, extensions.crypt(p_new_pin, extensions.gen_salt('bf', 10)), 0, null, now())
  on conflict (user_id) do update
    set pin_hash = excluded.pin_hash,
        failed_attempts = 0,
        locked_until = null,
        pin_updated_at = now();

  -- Any outstanding payment authorizations were made with the old PIN.
  delete from public.auth_challenges where user_id = v_uid;

  return jsonb_build_object('ok', true);
end;
$$;

-- Check the PIN; on success return a one-time token for the next payment.
create or replace function public.verify_pin(p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := auth.uid();
  v_check    jsonb;
  v_settings record;
  v_token    text;
  v_expires  timestamptz;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  v_check := public._check_pin(v_uid, p_pin);
  if not (v_check ->> 'ok')::boolean then
    return v_check;
  end if;

  select * into v_settings from public.pin_settings();
  v_token   := encode(extensions.gen_random_bytes(32), 'hex');
  v_expires := now() + make_interval(secs => v_settings.token_ttl_seconds);

  delete from public.auth_challenges
   where user_id = v_uid and (expires_at < now() or used_at is not null);

  insert into public.auth_challenges (token_hash, user_id, expires_at)
  values (encode(extensions.digest(v_token, 'sha256'), 'hex'), v_uid, v_expires);

  return jsonb_build_object('ok', true, 'token', v_token, 'expires_at', v_expires);
end;
$$;

-- Internal: validate + burn a token. Raises (rolling back the payment) if invalid.
create or replace function public._consume_auth_token(p_uid uuid, p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.auth_challenges%rowtype;
begin
  if p_token is null or p_token = '' then raise exception 'authorization_required'; end if;

  select * into v_row
    from public.auth_challenges
   where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
     and user_id = p_uid
   for update;

  if not found or v_row.used_at is not null then raise exception 'authorization_required'; end if;
  if v_row.expires_at < now() then raise exception 'authorization_expired'; end if;

  update public.auth_challenges set used_at = now() where token_hash = v_row.token_hash;
end;
$$;

-- =============================================================================
-- Money functions now require the token
-- =============================================================================
drop function public.send_money(uuid, bigint, text, uuid);
drop function public.add_expense(bigint, uuid, text, boolean, uuid);

create function public.send_money(
  p_recipient_id    uuid,
  p_amount_cents    bigint,
  p_auth_token      text,
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

  perform public._consume_auth_token(v_uid, p_auth_token);

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

  insert into public.contacts (owner_id, contact_id)
  values (v_uid, p_recipient_id)
  on conflict do nothing;

  return v_tx_id;
end;
$$;

-- p_auth_token is only required when the expense is paid from the wallet.
create function public.add_expense(
  p_amount_cents       bigint,
  p_category_id        uuid,
  p_note               text default null,
  p_deduct_from_wallet boolean default true,
  p_idempotency_key    uuid default null,
  p_auth_token         text default null
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

  if v_deduct then
    perform public._consume_auth_token(v_uid, p_auth_token);
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

-- =============================================================================
-- Permissions
-- =============================================================================
revoke execute on function
  public._check_pin(uuid, text),
  public._consume_auth_token(uuid, text)
from public, anon, authenticated;

revoke execute on function
  public.security_status(),
  public.set_pin(text, text),
  public.verify_pin(text),
  public.pin_settings(),
  public.pin_is_weak(text),
  public.send_money(uuid, bigint, text, text, uuid),
  public.add_expense(bigint, uuid, text, boolean, uuid, text)
from public, anon;

grant execute on function
  public.security_status(),
  public.set_pin(text, text),
  public.verify_pin(text),
  public.pin_settings(),
  public.pin_is_weak(text),
  public.send_money(uuid, bigint, text, text, uuid),
  public.add_expense(bigint, uuid, text, boolean, uuid, text)
to authenticated;
