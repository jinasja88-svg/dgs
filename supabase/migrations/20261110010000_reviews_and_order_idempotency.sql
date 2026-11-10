-- 1) sourcing_reviews: 운영 DB에 누락돼 있던 리뷰 테이블 생성
--    product_ids 는 리뷰 작성 시점의 주문 상품 ID 목록(비정규화) — 상품별 리뷰 조회를 인덱스로 처리
create table if not exists public.sourcing_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.sourcing_orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 500),
  product_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (order_id, user_id)
);

create index if not exists idx_sourcing_reviews_product_ids on public.sourcing_reviews using gin (product_ids);
create index if not exists idx_sourcing_reviews_user on public.sourcing_reviews (user_id, created_at desc);

alter table public.sourcing_reviews enable row level security;

-- 본인 리뷰 조회만 허용. 작성은 서버 API(배송완료·소유권 검증 후 service role)에서만.
drop policy if exists "Users can view own reviews" on public.sourcing_reviews;
create policy "Users can view own reviews" on public.sourcing_reviews
  for select using (auth.uid() = user_id);

-- 2) 주문 멱등성 키: 같은 결제 시도에서 동시에 들어온 주문 생성 요청을 DB 수준에서 1건으로 제한
alter table public.sourcing_orders add column if not exists idempotency_key text;
create unique index if not exists uq_sourcing_orders_user_idempotency
  on public.sourcing_orders (user_id, idempotency_key)
  where idempotency_key is not null;
