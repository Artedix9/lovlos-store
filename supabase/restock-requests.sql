-- Back-in-stock waitlist — run once in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run).
--
-- Customers on a sold-out product page leave their WhatsApp number;
-- the admin Inventory tab shows who is waiting per product.

create table if not exists restock_requests (
  id         uuid primary key default gen_random_uuid(),
  product_id text not null,
  phone      text not null,
  created_at timestamptz not null default now(),
  unique (product_id, phone)
);
