-- Saved contacts with display details.
-- profiles RLS only lets a user read their own row, so the contact's name and
-- wallet tag are exposed through this function, and only for people the
-- caller has already saved or paid. Email is deliberately not returned.
create or replace function public.list_contacts()
returns table (id uuid, full_name text, wallet_tag text, nickname text, last_sent_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id,
         p.full_name,
         p.wallet_tag,
         c.nickname,
         (select max(t.created_at)
            from public.transactions t
           where t.user_id = c.owner_id
             and t.counterparty_user_id = c.contact_id
             and t.direction = 'out') as last_sent_at
  from public.contacts c
  join public.profiles p on p.id = c.contact_id
  where c.owner_id = (select auth.uid())
  order by last_sent_at desc nulls last, p.full_name;
$$;

revoke execute on function public.list_contacts() from public, anon;
grant execute on function public.list_contacts() to authenticated;
