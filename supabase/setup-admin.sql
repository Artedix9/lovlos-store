-- LOVLOS admin setup — run once in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run).
--
-- Fixes two admin save errors:
--   1. "Units in Stock" on products — adds the missing stock_quantity column.
--   2. Hero image saves — creates the hero_images table, which was never created.

alter table products
  add column if not exists stock_quantity integer not null default 0;

create table if not exists hero_images (
  page        text primary key,          -- 'home' | 'women' | 'men' | 'accessories'
  desktop_src text not null default '',
  mobile_src  text not null default '',
  updated_at  timestamptz not null default now()
);
