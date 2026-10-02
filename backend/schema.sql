-- Public-safe entry fee RPC. Only the numeric fee is exposed; the WhatsApp link remains admin-only.
create or replace function public.get_entry_fee()
returns integer
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(entry_fee, 0)
  from public.tournament_settings
  where id = 1;
$$;

revoke all on function public.get_entry_fee() from public;
grant execute on function public.get_entry_fee() to anon, authenticated;

-- Used by RLS so the browser cannot submit a fake fee.
create or replace function private.current_entry_fee()
returns integer
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(entry_fee, 0)
  from public.tournament_settings
  where id = 1;
$$;

revoke all on function private.current_entry_fee() from public;
grant execute on function private.current_entry_fee() to anon, authenticated;

drop policy if exists "Public can create registrations" on public.registrations;

create policy "Public can create registrations"
on public.registrations
for insert
to anon, authenticated
with check (
  registration_status = 'REGISTERED'
  and payment_status = 'PENDING'
  and entry_fee = (select private.current_entry_fee())
);