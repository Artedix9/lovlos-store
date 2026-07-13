-- Customer preferences keyed by normalized phone — run once in the SQL Editor.
-- Orders remain the source of truth for history; this table only stores what
-- orders can't: broadcast consent, VIP flag, and a free-form note.
create table if not exists customers (
  phone      text primary key,          -- 255XXXXXXXXX normalized
  opted_in   boolean not null default false,
  vip        boolean not null default false,
  note       text not null default '',
  updated_at timestamptz not null default now()
);
