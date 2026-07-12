-- Buying price (cost) per product — run once in the Supabase SQL Editor.
-- Admin-only: never returned by public APIs. Powers profit figures on the
-- admin Overview. Order items snapshot the cost at sale time so later cost
-- changes don't rewrite past profits.

alter table products
  add column if not exists cost_price integer check (cost_price is null or cost_price >= 0);
