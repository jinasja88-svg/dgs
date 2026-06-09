-- 실시간 고객센터 채팅 (Supabase Realtime) — 기존 CS 시스템과 병행
-- 고객 ↔ 관리자 1:1 실시간 채팅. 관리자 식별은 profiles.role = 'admin'.

-- 관리자 판별 헬퍼 (RLS 재사용)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 대화방 (사용자당 open 1개)
create table if not exists public.cs_chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'open',
  last_message text,
  last_message_at timestamptz default now(),
  unread_admin integer not null default 0,
  unread_user integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists cs_chat_conversations_user_open
  on public.cs_chat_conversations(user_id) where status = 'open';

-- 메시지
create table if not exists public.cs_chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.cs_chat_conversations(id) on delete cascade,
  sender text not null check (sender in ('user', 'admin')),
  sender_id uuid,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists cs_chat_messages_conv
  on public.cs_chat_messages(conversation_id, created_at);

alter table public.cs_chat_conversations enable row level security;
alter table public.cs_chat_messages enable row level security;

-- 대화방 정책
drop policy if exists cs_conv_select on public.cs_chat_conversations;
create policy cs_conv_select on public.cs_chat_conversations
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists cs_conv_insert on public.cs_chat_conversations;
create policy cs_conv_insert on public.cs_chat_conversations
  for insert with check (user_id = auth.uid());

drop policy if exists cs_conv_update on public.cs_chat_conversations;
create policy cs_conv_update on public.cs_chat_conversations
  for update using (user_id = auth.uid() or public.is_admin());

-- 메시지 정책
drop policy if exists cs_msg_select on public.cs_chat_messages;
create policy cs_msg_select on public.cs_chat_messages
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.cs_chat_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists cs_msg_user_insert on public.cs_chat_messages;
create policy cs_msg_user_insert on public.cs_chat_messages
  for insert with check (
    sender = 'user'
    and exists (
      select 1 from public.cs_chat_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists cs_msg_admin_insert on public.cs_chat_messages;
create policy cs_msg_admin_insert on public.cs_chat_messages
  for insert with check (sender = 'admin' and public.is_admin());

-- 새 메시지 → 대화방 요약/미읽음 갱신
create or replace function public.cs_chat_touch()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.cs_chat_conversations
    set last_message    = new.body,
        last_message_at = new.created_at,
        updated_at      = now(),
        unread_admin    = case when new.sender = 'user'  then unread_admin + 1 else 0 end,
        unread_user     = case when new.sender = 'admin' then unread_user  + 1 else 0 end
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists cs_chat_msg_touch on public.cs_chat_messages;
create trigger cs_chat_msg_touch
  after insert on public.cs_chat_messages
  for each row execute function public.cs_chat_touch();

-- Realtime 발행 (이미 추가돼 있으면 무시)
do $$ begin
  alter publication supabase_realtime add table public.cs_chat_messages;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.cs_chat_conversations;
exception when others then null; end $$;
