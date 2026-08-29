-- Enable UUID extension for generating IDs
create extension if not exists "uuid-ossp";

-- 1. Quotes Table
create table if not exists public.quotes (
  id uuid default uuid_generate_v4() primary key,
  text text not null,
  author text not null,
  category text not null,
  language text not null default 'English',
  country text,
  original_language text,
  source text,
  is_original boolean default true,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- For existing databases created before multi-language support:
alter table public.quotes add column if not exists language text not null default 'English';

-- Country-based quote system (native/original quotes, never machine-translated):
alter table public.quotes add column if not exists country text;
alter table public.quotes add column if not exists original_language text;
alter table public.quotes add column if not exists source text;
alter table public.quotes add column if not exists is_original boolean default true;

-- Faster per-language / per-country / per-category lookups.
create index if not exists quotes_language_idx on public.quotes (language);
create index if not exists quotes_country_idx on public.quotes (country);
create index if not exists quotes_original_language_idx on public.quotes (original_language);
create index if not exists quotes_category_idx on public.quotes (category);

-- 2. Categories Table
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Admins Table (Used for custom PIN-based auth)
create table if not exists public.admins (
  id uuid default uuid_generate_v4() primary key,
  email text not null unique,
  pin text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Ad Settings Table
create table if not exists public.ad_settings (
  id uuid default uuid_generate_v4() primary key,
  banner_enabled boolean default true,
  interstitial_enabled boolean default true,
  banner_id text,
  interstitial_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SEED DATA

-- Default Categories
insert into public.categories (name) values
  ('Motivation'),
  ('Inspiration'),
  ('Life'),
  ('Success'),
  ('Wisdom'),
  ('Romantic'),
  ('Sad')
on conflict (name) do nothing;

-- Default Admin (as per replit.md)
insert into public.admins (email, pin) values
  ('admin@dailyspark.com', '1234')
on conflict (email) do nothing;

-- Default Ad Settings (Ensure one row exists)
insert into public.ad_settings (banner_enabled, interstitial_enabled)
select true, true
where not exists (select 1 from public.ad_settings);

-- ROW LEVEL SECURITY (RLS)
-- Since the app uses the Supabase client directly with the anon key and handles
-- admin verification via the 'admins' table lookup, we enable public access.

alter table public.quotes enable row level security;
create policy "Public access to quotes" on public.quotes for all using (true);

alter table public.categories enable row level security;
create policy "Public access to categories" on public.categories for all using (true);

alter table public.admins enable row level security;
create policy "Public access to admins" on public.admins for all using (true);

alter table public.ad_settings enable row level security;
create policy "Public access to ad_settings" on public.ad_settings for all using (true);