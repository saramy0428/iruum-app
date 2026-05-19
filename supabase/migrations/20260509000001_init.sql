-- iRuum initial schema
-- Phase 1 Week 1: tables + RLS + product seed.
-- Auth wiring (claim anonymous saju_results) lands in Week 2.

-- ─── EXTENSIONS ──────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";


-- ─── PROFILES ────────────────────────────────────────────────────────────────
-- Mirrors auth.users for app-level profile data. Auto-populated by trigger.

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  display_name  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: user reads own row"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: user updates own row"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on auth signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─── SAJU_RESULTS ────────────────────────────────────────────────────────────
-- One row per generator submission. user_id null = anonymous (claimable Week 2).
-- session_seed is the deterministic seed string from generateDestinyName;
-- it doubles as the soft access token for anonymous result retrieval.

create table public.saju_results (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references auth.users(id) on delete set null,
  session_seed      text not null,
  input             jsonb not null,        -- { surname, birthDate, birthTime, birthCountry, birthCity, gender }
  saju_summary      jsonb not null,        -- { dominantElement, lackingElement, balanceState, elementalDistribution, dominantPolarity }
  recommended_name  jsonb not null,        -- full `name` shape from generateDestinyName
  strategy          jsonb not null,        -- { kind, target, support, avoid, summary }
  reason            text not null,
  four_pillars      jsonb not null,        -- raw getFourPillars output, kept so PDF render doesn't recompute
  created_at        timestamptz not null default now()
);

create index saju_results_user_id_idx     on public.saju_results (user_id) where user_id is not null;
create index saju_results_session_seed_idx on public.saju_results (session_seed);
create index saju_results_created_at_idx   on public.saju_results (created_at desc);

alter table public.saju_results enable row level security;

-- Owners (signed-in users) can read their rows.
create policy "saju_results: owner reads"
  on public.saju_results for select
  using (auth.uid() = user_id);

-- Anonymous read path (by session_seed) is intentionally NOT a policy:
--   anon reads happen through the service-role server client in /api routes,
--   which bypasses RLS. This keeps the seed-as-soft-token logic in app code
--   where we can rate-limit and audit it.
-- No public select/insert/update policies — service role handles everything.


-- ─── PRODUCTS ────────────────────────────────────────────────────────────────

create table public.products (
  id            uuid primary key default uuid_generate_v4(),
  slug          text unique not null,
  type          text not null check (type in ('digital', 'physical')),
  title         text not null,
  description   text,
  price_cents   integer not null check (price_cents >= 0),
  currency      text not null default 'usd',
  is_active     boolean not null default true,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.products enable row level security;

-- Public read of active products (catalog browsing without auth).
create policy "products: anyone reads active"
  on public.products for select
  using (is_active = true);


-- ─── ORDERS ──────────────────────────────────────────────────────────────────
-- email is required even for guest checkout (PDF delivery target).
-- saju_result_id is required: every product personalizes off a saju.

create table public.orders (
  id                        uuid primary key default uuid_generate_v4(),
  user_id                   uuid references auth.users(id) on delete set null,
  saju_result_id            uuid not null references public.saju_results(id) on delete restrict,
  email                     text not null,
  status                    text not null default 'pending'
                              check (status in ('pending','paid','fulfilled','cancelled','refunded')),
  stripe_session_id         text unique,
  stripe_payment_intent_id  text unique,
  subtotal_cents            integer not null check (subtotal_cents >= 0),
  total_cents               integer not null check (total_cents >= 0),
  currency                  text not null default 'usd',
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  paid_at                   timestamptz,
  fulfilled_at              timestamptz
);

create index orders_user_id_idx        on public.orders (user_id) where user_id is not null;
create index orders_email_idx          on public.orders (lower(email));
create index orders_status_idx         on public.orders (status);
create index orders_created_at_idx     on public.orders (created_at desc);

alter table public.orders enable row level security;

create policy "orders: owner reads"
  on public.orders for select
  using (auth.uid() = user_id);


-- ─── ORDER_ITEMS ─────────────────────────────────────────────────────────────
-- unit_price_cents + product_snapshot capture price/title at purchase time so
-- catalog edits don't rewrite history.

create table public.order_items (
  id                  uuid primary key default uuid_generate_v4(),
  order_id            uuid not null references public.orders(id) on delete cascade,
  product_id          uuid not null references public.products(id) on delete restrict,
  quantity            integer not null default 1 check (quantity > 0),
  unit_price_cents    integer not null check (unit_price_cents >= 0),
  product_snapshot    jsonb not null,
  delivery_status     text not null default 'pending'
                        check (delivery_status in ('pending','delivered','shipped')),
  delivery_metadata   jsonb not null default '{}'::jsonb,  -- digital: { fileUrl }, physical: { trackingNumber, carrier }
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index order_items_order_id_idx   on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

alter table public.order_items enable row level security;

create policy "order_items: owner reads via order"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
  );


-- ─── WEBHOOK_EVENTS ──────────────────────────────────────────────────────────
-- Stripe event id is the natural primary key — guarantees idempotent processing.

create table public.webhook_events (
  id            text primary key,        -- Stripe event id (evt_...)
  type          text not null,
  payload       jsonb not null,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz
);

create index webhook_events_type_idx       on public.webhook_events (type);
create index webhook_events_processed_idx  on public.webhook_events (processed_at) where processed_at is null;

alter table public.webhook_events enable row level security;
-- No policies: service role only. Webhook processing is server-side, untrusted clients have no business reading this.


-- ─── UPDATED_AT TRIGGERS ─────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at    before update on public.profiles    for each row execute function public.set_updated_at();
create trigger products_set_updated_at    before update on public.products    for each row execute function public.set_updated_at();
create trigger orders_set_updated_at      before update on public.orders      for each row execute function public.set_updated_at();
create trigger order_items_set_updated_at before update on public.order_items for each row execute function public.set_updated_at();


-- ─── PRODUCT SEED ────────────────────────────────────────────────────────────

insert into public.products (slug, type, title, description, price_cents, currency, metadata)
values (
  'pdf-infographic',
  'digital',
  'Personalized Saju Infographic (PDF)',
  'A single-page PDF showing your Four Pillars, Five Elements distribution, recommended Korean name, and the reasoning behind it. Delivered to your email after checkout.',
  900,
  'usd',
  jsonb_build_object('format', 'pdf', 'pages', 1, 'language', 'en')
)
on conflict (slug) do nothing;
