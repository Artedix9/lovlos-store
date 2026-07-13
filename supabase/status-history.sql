-- Per-status timestamps — run once in the Supabase SQL Editor.
-- status_history records the FIRST time an order reaches each status
-- (follow-ups and weekly KPIs key off these). followups_done tracks the
-- Day-2/14/45 WhatsApp touchpoints. cancel_reason powers COD refusal stats.
alter table orders
  add column if not exists status_history jsonb not null default '{}'::jsonb,
  add column if not exists followups_done jsonb not null default '{}'::jsonb,
  add column if not exists cancel_reason  text;

-- Backfill: treat existing non-pending orders' created_at as best guess.
update orders
set status_history = jsonb_build_object(status, created_at)
where status_history = '{}'::jsonb and status <> 'pending';
