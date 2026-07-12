-- Promo codes — run once in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run).

-- 1. Promo codes, managed from the admin Promos tab.
--    free_delivery codes store discount_value = 0; the discount equals the
--    delivery fee at checkout time.
create table if not exists promo_codes (
  code           text primary key,                 -- stored uppercase
  discount_type  text not null check (discount_type in ('percent', 'fixed', 'free_delivery')),
  discount_value integer not null check (discount_value >= 0),
  min_subtotal   integer not null default 0,       -- TZS required before the code applies
  max_uses       integer,                          -- null = unlimited
  use_count      integer not null default 0,
  expires_at     timestamptz,                      -- null = never expires
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- 2. Orders remember which code was used and how much was taken off.
alter table orders
  add column if not exists promo_code text,
  add column if not exists discount integer not null default 0;

-- 2b. Upgrade path for databases created before free_delivery existed
--     (harmless to re-run; matches the create-table definition above).
alter table promo_codes drop constraint if exists promo_codes_discount_type_check;
alter table promo_codes add constraint promo_codes_discount_type_check
  check (discount_type in ('percent', 'fixed', 'free_delivery'));
alter table promo_codes drop constraint if exists promo_codes_discount_value_check;
alter table promo_codes add constraint promo_codes_discount_value_check
  check (discount_value >= 0);

-- 3. Atomic use counter — avoids two orders racing on read-then-write.
create or replace function increment_promo_use(p_code text)
returns void
language sql
as $$
  update promo_codes set use_count = use_count + 1 where code = p_code;
$$;
