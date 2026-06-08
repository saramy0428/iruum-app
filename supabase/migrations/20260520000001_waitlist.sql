-- iRuum waitlist
-- Email collection for physical-goods products that aren't shipping yet.
-- Inserts are public (anon allowed); reads are service-role only.

create table public.waitlist (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  product_type  text not null check (product_type in ('name-stamp', 'goods-collection')),
  created_at    timestamptz not null default now(),
  unique (email, product_type)
);

create index waitlist_product_type_idx on public.waitlist (product_type);
create index waitlist_created_at_idx   on public.waitlist (created_at desc);

alter table public.waitlist enable row level security;

-- Anyone (anon + authenticated) can submit; the unique constraint dedupes.
create policy "waitlist: public insert"
  on public.waitlist for insert
  to anon, authenticated
  with check (true);

-- No select/update/delete policies — service role only.
