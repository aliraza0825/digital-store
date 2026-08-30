-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).

create extension if not exists "pgcrypto";

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  price_cents integer not null,           -- store price in cents to avoid float issues, e.g. 500 = $5.00
  currency text not null default 'USD',
  thumbnail_path text not null,           -- path inside the public "thumbnails" bucket
  file_path text not null,                -- path inside the private "product-files" bucket
  lemonsqueezy_variant_id text not null,  -- variant id from the matching product you create in Lemon Squeezy
  sold_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  order_ref text not null unique,         -- generated before checkout, used to match the webhook + thank-you redirect
  buyer_email text not null,
  buyer_name text,
  buyer_address text,
  lemonsqueezy_order_id text,
  status text not null default 'pending', -- pending -> paid
  download_token text unique,             -- generated once payment is confirmed by the webhook
  token_used boolean not null default false,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists idx_orders_order_ref on orders(order_ref);
create index if not exists idx_orders_download_token on orders(download_token);

-- Atomic increment so concurrent sales never lose a count
create or replace function increment_sold_count(pid uuid)
returns void as $$
  update products set sold_count = sold_count + 1 where id = pid;
$$ language sql;

-- Row Level Security: the public site only ever reads products through the anon key,
-- and never touches orders directly (that's all done server-side with the service role key).
alter table products enable row level security;
alter table orders enable row level security;

create policy "Public can read active products"
  on products for select
  using (is_active = true);

-- No public policies on orders at all -> only the service role key (server-side) can read/write it.

-- Storage buckets:
-- 1. "thumbnails"     -> public bucket, product cover images
-- 2. "product-files"  -> PRIVATE bucket, the actual Canva/PDF/ebook files
-- Create both under Storage in the Supabase dashboard, or run:
insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('product-files', 'product-files', false)
on conflict (id) do nothing;
