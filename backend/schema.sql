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