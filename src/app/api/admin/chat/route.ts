import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { isAdmin } from '@/lib/auth';

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 }), user: null };
  if (!(await isAdmin(user.id))) return { error: NextResponse.json({ error: '권한이 없습니다' }, { status: 403 }), user: null };
  return { error: null, user };
}

// GET            → 대화 목록(고객 이메일/이름 포함, 메시지 있는 것만)
// GET ?conversation_id=X → 해당 대화 메시지 + unread_admin 0 으로 리셋
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = createAdminClient();
  const conversationId = new URL(request.url).searchParams.get('conversation_id');

  if (conversationId) {
    const { data: messages, error: mErr } = await admin
      .from('cs_chat_messages')
      .select('id, conversation_id, sender, body, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

    // 관리자가 열람했으므로 미읽음 초기화
    await admin.from('cs_chat_conversations').update({ unread_admin: 0 }).eq('id', conversationId);

    return NextResponse.json({ messages: messages ?? [] });
  }

  const { data: convs, error: cErr } = await admin
    .from('cs_chat_conversations')
    .select('id, user_id, status, last_message, last_message_at, unread_admin')
    .not('last_message', 'is', null)
    .order('last_message_at', { ascending: false });
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

  const rows = convs ?? [];
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
  const profileMap: Record<string, { name: string | null; email: string | null }> = {};
  if (userIds.length) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, name, email')
      .in('id', userIds);
    for (const p of profiles ?? []) profileMap[p.id] = { name: p.name ?? null, email: p.email ?? null };
  }

  const conversations = rows.map((r) => ({
    ...r,
    profile: profileMap[r.user_id] ?? { name: null, email: null },
  }));

  return NextResponse.json({ conversations });
}

// POST { conversation_id, body } → 관리자 답변 전송
export async function POST(request: NextRequest) {
  const { error, user } = await requireAdmin();
  if (error) return error;

  let body: { conversation_id?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 });
  }
  const conversationId = body.conversation_id;
  const text = (body.body || '').trim();
  if (!conversationId || !text) {
    return NextResponse.json({ error: '대화와 메시지를 확인해주세요' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error: iErr } = await admin
    .from('cs_chat_messages')
    .insert({ conversation_id: conversationId, sender: 'admin', sender_id: user!.id, body: text })
    .select('id, conversation_id, sender, body, created_at')
    .single();
  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
