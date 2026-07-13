-- Early-access gating — run once in the Supabase SQL Editor.
-- A product with publish_at in the future shows as Coming Soon publicly,
-- but is fully buyable for visitors whose stored promo code (?promo=CODE
-- campaign link) matches access_code. Server-side enforced: the order API
-- rejects gated items without the matching code. access_code is never
-- exposed by public APIs.
alter table products
  add column if not exists access_code text,          -- promo code that unlocks early
  add column if not exists publish_at  timestamptz;   -- public from this moment
