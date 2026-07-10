-- Email sign-ups — run once in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run).
--
-- Captures the footer "Stay in the vibe" form (which previously saved
-- nothing) and the checkout opt-in. Deduped by email.

create table if not exists email_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  source     text not null default 'footer',   -- 'footer' | 'checkout'
  created_at timestamptz not null default now()
);
