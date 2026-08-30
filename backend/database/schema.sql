-- Run once against your PostgreSQL database.
-- If upgrading from an older schema, drop existing tables first:
--   drop table if exists order_items, orders, cart_items, carts, products, users cascade;

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text,
  last_name text,
  role text not null default 'customer' check (role in ('admin', 'customer')),
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_role on users(role);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  price_cents integer not null,
  currency text not null default 'USD',
  thumbnail_path text not null,
  file_path text not null,
  lemonsqueezy_variant_id text,
  sold_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  session_id text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_carts_user_id on carts(user_id);
create index if not exists idx_carts_session_id on carts(session_id);
create index if not exists idx_carts_status on carts(status);

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity integer not null default 1,
  created_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  order_ref text not null unique,
  buyer_email text not null,
  buyer_name text,
  buyer_address text,
  total_cents integer not null default 0,
  currency text not null default 'USD',
  lemonsqueezy_order_id text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_orders_order_ref on orders(order_ref);
create index if not exists idx_orders_status on orders(status);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity integer not null default 1,
  price_cents integer not null,
  download_token text unique,
  token_used boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_order_items_download_token on order_items(download_token);

create or replace function increment_sold_count(pid uuid, qty integer default 1)
returns void as $$
  update products set sold_count = sold_count + qty where id = pid;
$$ language sql;
