-- VELORA EDIT — Supabase schema (free tier compatible, no paid extensions).
-- Public: read published content only. Admins: full management via profiles.role = 'admin'.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'viewer' check (role in ('admin','editor','viewer')),
  created_at timestamptz default now()
);

create table if not exists categories (
  slug text primary key,
  title text not null,
  description text default '',
  created_at timestamptz default now()
);

create table if not exists collections (
  slug text primary key,
  title text not null,
  description text default '',
  image text default '',
  editorial text default '',
  created_at timestamptz default now()
);

create table if not exists products (
  id text primary key,
  slug text unique not null,
  title text not null,
  subtitle text default '',
  description text not null,
  editor_note text default '',
  category text references categories(slug),
  price numeric,
  currency text default 'EUR',
  original_price numeric,
  image_urls text[] default '{}',
  thumbnail_url text default '',
  material text default '',
  color text default '',
  gender text default 'unisex' check (gender in ('women','men','unisex')),
  tags text[] default '{}',
  ali_product_id text default '',
  affiliate_url text,
  source_url text default '',
  is_featured boolean default false,
  is_new boolean default false,
  is_best_value boolean default false,
  editor_pick boolean default false,
  is_published boolean default false,
  status text default 'DRAFT' check (status in ('DRAFT','REVIEW','PUBLISHED','ARCHIVED')),
  editorial_score int default 0 check (editorial_score between 0 and 100),
  seo_title text default '',
  seo_description text default '',
  og_image text default '',
  price_freshness timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_products_slug on products(slug);
create index if not exists idx_products_status on products(status);
create index if not exists idx_products_category on products(category);

create table if not exists product_categories (
  product_id text references products(id) on delete cascade,
  category_slug text references categories(slug) on delete cascade,
  primary key (product_id, category_slug)
);

create table if not exists product_collections (
  product_id text references products(id) on delete cascade,
  collection_slug text references collections(slug) on delete cascade,
  primary key (product_id, collection_slug)
);

create table if not exists affiliate_links (
  id uuid primary key default gen_random_uuid(),
  product_id text references products(id) on delete set null,
  source_url text not null,
  affiliate_url text not null,
  provider text default 'aliexpress',
  is_valid boolean default true,
  last_checked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists click_events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('product_view','affiliate_click','search','collection_view','newsletter_signup')),
  product_id text references products(id) on delete set null,
  session_id text,
  referrer text,
  page_url text,
  device text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);
create index if not exists idx_click_events_type on click_events(event_type);
create index if not exists idx_click_events_product on click_events(product_id);
create index if not exists idx_click_events_created on click_events(created_at);

create table if not exists editorial_articles (
  slug text primary key,
  title text not null,
  excerpt text default '',
  body text[] default '{}',
  image text default '',
  published boolean default true,
  published_at timestamptz default now()
);

create table if not exists newsletter_subscribers (
  id bigint generated always as identity primary key,
  email text unique not null,
  consent boolean default true,
  created_at timestamptz default now()
);

create table if not exists admin_audit_logs (
  id bigint generated always as identity primary key,
  actor_email text,
  action text not null,
  entity text,
  entity_id text,
  created_at timestamptz default now()
);

create table if not exists imports (
  id uuid primary key default gen_random_uuid(),
  source text default 'manual',
  status text default 'pending',
  created_by text,
  created_at timestamptz default now()
);

create table if not exists import_items (
  id bigint generated always as identity primary key,
  import_id uuid references imports(id) on delete cascade,
  payload jsonb not null,
  verdict text default 'pending',
  reasons text[] default '{}'
);

create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Row Level Security
alter table profiles enable row level security;
alter table products enable row level security;
alter table categories enable row level security;
alter table collections enable row level security;
alter table product_categories enable row level security;
alter table product_collections enable row level security;
alter table affiliate_links enable row level security;
alter table click_events enable row level security;
alter table editorial_articles enable row level security;
alter table newsletter_subscribers enable row level security;
alter table admin_audit_logs enable row level security;
alter table imports enable row level security;
alter table import_items enable row level security;
alter table site_settings enable row level security;

-- Public read: published products/articles, categories, collections, settings(except secrets — secrets never stored here)
create policy "public read published products" on products for select using (is_published = true and status = 'PUBLISHED' and affiliate_url is not null);
create policy "public read categories" on categories for select using (true);
create policy "public read collections" on collections for select using (true);
create policy "public read product links" on product_categories for select using (true);
create policy "public read product collections" on product_collections for select using (true);
create policy "public read articles" on editorial_articles for select using (published = true);
create policy "anon insert clicks" on click_events for insert with check (true);
create policy "anon subscribe" on newsletter_subscribers for insert with check (true);

-- Admins: full access (server-side role check; never trust client isAdmin)
create policy "admin all products" on products for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);
create policy "admin all clicks" on click_events for select using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);
create policy "admin all rest" on affiliate_links for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);
