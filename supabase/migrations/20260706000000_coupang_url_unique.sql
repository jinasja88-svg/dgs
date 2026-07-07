-- coupang_products.coupang_url 에 UNIQUE 인덱스 추가
-- 임포트 스크립트(scripts/import-coupang-data.mjs)의 onConflict: 'coupang_url' 업서트 전제조건.
create unique index if not exists coupang_products_coupang_url_key
  on public.coupang_products (coupang_url);
