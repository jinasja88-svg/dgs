-- 영구 API 응답 캐시 테이블
-- TMAPI(검색/상세/리뷰/이미지검색) 등 외부 유료 API 결과를 저장해
-- 서버리스 콜드스타트 시에도 캐시 적중률을 유지하기 위함.
--
-- 적용 방법: Supabase SQL Editor에 그대로 붙여넣어 실행.

create table if not exists public.api_cache (
  cache_key   text primary key,
  value       jsonb not null,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_api_cache_expires_at on public.api_cache (expires_at);

alter table public.api_cache enable row level security;

-- 기본 차단(서비스 롤만 접근). 일반 사용자/익명 접근 정책은 만들지 않음.
drop policy if exists "deny all" on public.api_cache;
create policy "deny all" on public.api_cache
  for all
  to authenticated, anon
  using (false)
  with check (false);

-- 만료된 캐시 정리(선택). pg_cron 사용 시 다음 작업을 등록:
-- select cron.schedule('purge-api-cache', '0 * * * *', $$delete from public.api_cache where expires_at < now()$$);
