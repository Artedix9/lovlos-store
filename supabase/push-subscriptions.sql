-- New-order push alerts for the admin.
-- Applied directly via the Supabase connector on 2026-07-04 — kept here as a record.
-- VAPID keys live in site_settings (keys: vapid_public / vapid_private).

create table if not exists push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  subscription jsonb not null,
  endpoint     text not null unique,
  created_at   timestamptz not null default now()
);
