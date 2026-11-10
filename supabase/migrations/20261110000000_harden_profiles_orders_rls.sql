-- 보안 강화: 권한 상승 / 주문 위·변조 차단
-- 1) profiles.role·email 은 사용자가 직접 바꿀 수 없다 (관리자·service_role만)
-- 2) sourcing_orders 는 사용자가 직접 INSERT/UPDATE 할 수 없다.
--    주문 생성·취소·결제확정은 서버 API(service_role)에서 검증 후 처리한다.

-- ─── 1. profiles 권한 컬럼 보호 ───────────────────────────────
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- service_role / DB 소유자(마이그레이션·대시보드)는 제한 없음
  if coalesce(auth.role(), '') = 'service_role' or current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;
  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.role := 'user';
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'profiles.role cannot be changed by the user' using errcode = '42501';
  end if;
  if new.email is distinct from old.email then
    raise exception 'profiles.email cannot be changed by the user' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileged_columns on public.profiles;
create trigger protect_profile_privileged_columns
  before insert or update on public.profiles
  for each row execute function public.protect_profile_privileged_columns();

-- ─── 2. sourcing_orders 쓰기 정책 ────────────────────────────
drop policy if exists "Users can update own sourcing orders" on public.sourcing_orders;
drop policy if exists "Users can insert own sourcing orders" on public.sourcing_orders;

-- 관리자 화면(브라우저 클라이언트)에서의 상태/송장 변경은 유지
drop policy if exists "Admins can view all sourcing orders" on public.sourcing_orders;
create policy "Admins can view all sourcing orders" on public.sourcing_orders
  for select using (public.is_admin());

drop policy if exists "Admins can update sourcing orders" on public.sourcing_orders;
create policy "Admins can update sourcing orders" on public.sourcing_orders
  for update using (public.is_admin()) with check (public.is_admin());

-- ─── 3. 사용자별 유료 API 일일 사용량 (이미지 검색 / 상세페이지 생성) ───
create table if not exists public.user_api_usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  feature text not null,
  calls integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date, feature)
);
alter table public.user_api_usage_daily enable row level security;
-- 정책 없음 = service role 전용
