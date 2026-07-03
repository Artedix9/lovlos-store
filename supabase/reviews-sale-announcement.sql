-- Reviews, sale pricing & announcement bar — run once in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run).

-- 1. Customer reviews — hidden until approved in the admin Reviews tab.
create table if not exists product_reviews (
  id         uuid primary key default gen_random_uuid(),
  product_id text not null,
  author     text not null,
  rating     integer not null check (rating between 1 and 5),
  body       text not null,
  photo_url  text,
  approved   boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. Optional sale price — shown struck-through against the regular price.
alter table products
  add column if not exists sale_price integer;

-- 3. Site-wide settings (announcement bar text, editable from the admin).
create table if not exists site_settings (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now()
);
