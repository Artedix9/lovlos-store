-- Fit notes + "Style It With" pairings.
-- Applied directly via the Supabase connector on 2026-07-04 — kept here as a record.

alter table products
  add column if not exists fit text,                              -- 'runs-small' | 'true-to-size' | 'runs-large'
  add column if not exists fit_notes text not null default '',    -- e.g. "Model is 175cm and wears size M"
  add column if not exists styled_with jsonb not null default '[]'::jsonb;  -- array of product ids
