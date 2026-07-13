-- Promo landing-visit counter — run once in the Supabase SQL Editor.
-- PromoCapture pings /api/promo/visit once per session when a ?promo=CODE
-- link lands; the Overview promo table divides orders by visits to judge
-- influencer links in one read.
alter table promo_codes
  add column if not exists visit_count integer not null default 0;

-- Unknown codes no-op silently (mirrors adjust_promo_use).
create or replace function adjust_promo_visit(p_code text)
returns void
language sql
as $$
  update promo_codes set visit_count = visit_count + 1 where code = p_code;
$$;
