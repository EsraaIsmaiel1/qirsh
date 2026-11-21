# Supabase backend

`migrations/20261121000000_wallet_schema.sql` creates everything the app needs:

| Object | Purpose |
|---|---|
| `profiles` | One row per user: name, email, public `wallet_tag` (used on the Receive screen / QR) |
| `wallets` | Balance in **cents** (`bigint`, can never go negative) |
| `transactions` | Append-only ledger. A transfer writes two rows (`out` for the sender, `in` for the recipient) linked by `transfer_group` |
| `categories` | Built-in categories (seeded) + user-defined ones |
| `budgets` | Monthly limit per category per user |
| `contacts` | Saved recipients (filled automatically after a transfer) |
| `handle_new_user` trigger | Creates the profile + empty wallet when someone signs up (reads `full_name` from sign-up metadata) |

## Security model

* RLS is on for every table. Users only ever see their own rows; `anon` sees nothing.
* The app **cannot** write to `wallets` or `transactions`, or change `wallet_tag`/`email`.
  Money moves only through these functions, called with `supabase.rpc(...)`:

| Function | What it does |
|---|---|
| `find_recipient(query)` | Exact match on wallet tag or email → `{ id, full_name, wallet_tag }` |
| `send_money(recipient_id, amount_cents, note?, idempotency_key?)` | Locks both wallets, checks balance + limits, moves the money, writes both ledger rows |
| `add_expense(amount_cents, category_id, note?, deduct_from_wallet = true, idempotency_key?)` | Logs an expense, optionally paid from the wallet |
| `spending_by_category(from?, to?)` | Spent vs budget per category (defaults to this month) |
| `monthly_totals(months = 6)` | In / out / expense totals per month for the Analytics chart |

Errors come back as stable codes in `error.message`, for example `insufficient_funds`, `daily_limit_exceeded`,
`recipient_not_found`, `cannot_send_to_self`, `amount_exceeds_limit`, `invalid_amount`.

**Idempotency:** generate a UUID when the confirm screen opens and pass it as `p_idempotency_key`.
A double-tap or network retry then returns the original transaction instead of charging twice.

**Limits** (`wallet_limits()`): 50,000.00 per transfer and 100,000.00 per rolling 24h. These are placeholders; change them to suit your product.

**Adding money:** there is intentionally no client-callable top-up. Credit wallets from an Edge Function
(service role) after your payment provider confirms the payment, otherwise anyone could create money.

## Applying it

**Option A, Supabase CLI** (recommended). Run these from the project root, one time:

```bash
npx supabase login                                  # opens the browser to sign in
npx supabase init                                   # creates supabase/config.toml (answer "N" to the VS Code / Deno questions)
npx supabase link --project-ref <your-project-ref>  # asks for your database password
npx supabase db push --linked                       # applies everything in supabase/migrations
```

`<your-project-ref>` is the part of your Supabase URL before `.supabase.co`
(`https://<project-ref>.supabase.co`), also shown in Dashboard → Project Settings → General.

> If you see `Target: local stack (127.0.0.1:54322) … ECONNREFUSED`, the project isn't linked yet
> (or you used `--local`), so the CLI is looking for a local Docker database. Run `init` + `link` above, then
> `db push --linked`. You don't need Docker for this.

**Option B, Dashboard (no CLI):** open *SQL Editor* and run each file in `migrations/` once, **in filename order** (`…000000_wallet_schema`, then `…010000_list_contacts`, then `…020000_payment_pin`).

Then in *Authentication → Providers → Email*, decide whether "Confirm email" is on. The app handles both cases.

## Example calls from the app

```ts
const { data: recipient } = await supabase.rpc('find_recipient', { p_query: 'sara@email.com' }).maybeSingle();

const { data: txId, error } = await supabase.rpc('send_money', {
  p_recipient_id: recipient.id,
  p_amount_cents: Math.round(Number(amount) * 100),
  p_note: note,
  p_idempotency_key: idempotencyKey, // crypto.randomUUID() when the confirm screen opens
});
if (error?.message === 'insufficient_funds') { /* show message */ }
```
