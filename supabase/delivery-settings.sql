-- Delivery pricing → site_settings — run once in the Supabase SQL Editor.
-- Values are editable from the admin (Site & Banners tab) with no redeploy.
-- 100,000 is the launch-plan threshold; the code falls back to its previous
-- constants if these rows are ever missing.
insert into site_settings (key, value) values ('delivery_fee', '5000')
  on conflict (key) do nothing;
insert into site_settings (key, value) values ('free_delivery_threshold', '100000')
  on conflict (key) do nothing;
