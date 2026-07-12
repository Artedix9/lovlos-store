-- Automatic stock & promo-use adjustments on order status changes
-- — run once in the Supabase SQL Editor (after promo-codes.sql).

-- Stock is "held" while an order is confirmed/dispatched/delivered.
-- The admin orders API calls this when a status change crosses that
-- boundary: negative delta on confirm, positive when cancelled/reverted.
create or replace function adjust_stock(p_id text, p_delta integer)
returns void
language sql
as $$
  update products
  set stock_quantity = greatest(coalesce(stock_quantity, 0) + p_delta, 0)
  where id = p_id;
$$;

-- Generalises increment_promo_use so cancelling an order can release the
-- redemption (delta -1) and a re-confirmed order can re-take it (+1).
create or replace function adjust_promo_use(p_code text, p_delta integer)
returns void
language sql
as $$
  update promo_codes
  set use_count = greatest(use_count + p_delta, 0)
  where code = p_code;
$$;

-- Superseded by adjust_promo_use.
drop function if exists increment_promo_use(text);
