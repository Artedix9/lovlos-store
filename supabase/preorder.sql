-- Pre-orders for upcoming products — run once in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run).
--
-- A Coming Soon product with preorder = true becomes buyable ahead of
-- release; release_note is the customer-facing timing hint
-- (e.g. "Expected late July").

alter table products
  add column if not exists preorder boolean not null default false,
  add column if not exists release_note text not null default '';
