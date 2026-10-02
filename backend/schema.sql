-- PES Tournament backend-ready schema.
-- Payment gateway logic is intentionally not implemented yet.

create extension if not exists pgcrypto;

create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  registration_code text unique not null,
  name text not null,
  phone text not null,
  email text not null,
  pes_id text unique not null,
  entry_fee integer not null default 0,
  registration_status text not null default 'REGISTERED',
  payment_status text not null default 'PENDING',
  registered_at timestamptz not null default now()
);

create index if not exists registrations_pes_id_idx on registrations (lower(pes_id));
create index if not exists registrations_email_idx on registrations (lower(email));
create index if not exists registrations_registered_at_idx on registrations (registered_at desc);

create table if not exists tournament_settings (
  id integer primary key default 1,
  entry_fee integer not null default 0,
  whatsapp_group_url text,
  updated_at timestamptz not null default now()
);

insert into tournament_settings (id, entry_fee)
values (1, 0)
on conflict (id) do nothing;

alter table registrations enable row level security;
alter table tournament_settings enable row level security;

-- Public-safe entry fee RPC. Only the numeric fee is exposed.
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

create index if not exists registrations_registered_at_idx
  on registrations (registered_at desc);