-- Saved delivery addresses used by checkout and mypage.
create extension if not exists "uuid-ossp";

create table if not exists public.shipping_addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  recipient text not null,
  phone text not null,
  postal_code text,
  address text not null,
  address_detail text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipping_addresses_label_not_blank check (length(btrim(label)) > 0),
  constraint shipping_addresses_recipient_not_blank check (length(btrim(recipient)) > 0),
  constraint shipping_addresses_phone_not_blank check (length(btrim(phone)) > 0),
  constraint shipping_addresses_address_not_blank check (length(btrim(address)) > 0)
);

alter table public.shipping_addresses enable row level security;

drop policy if exists "Users can manage own shipping addresses" on public.shipping_addresses;
create policy "Users can manage own shipping addresses"
  on public.shipping_addresses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

with ranked as (
  select
    id,
    row_number() over (partition by user_id order by updated_at desc, created_at desc, id desc) as rn
  from public.shipping_addresses
  where is_default
)
update public.shipping_addresses s
set is_default = false
from ranked r
where s.id = r.id and r.rn > 1;

create unique index if not exists idx_shipping_addresses_one_default
  on public.shipping_addresses(user_id)
  where is_default;

create index if not exists idx_shipping_addresses_user
  on public.shipping_addresses(user_id, is_default desc, created_at desc);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_shipping_addresses_updated_at on public.shipping_addresses;
create trigger update_shipping_addresses_updated_at
  before update on public.shipping_addresses
  for each row execute function update_updated_at();
