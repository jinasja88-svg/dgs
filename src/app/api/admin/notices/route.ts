import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { isAdmin } from '@/lib/auth';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  if (!(await isAdmin(user.id))) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });

  const admin = createAdminClient();

  const { data, error } = await admin
    .from('notices')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  if (!(await isAdmin(user.id))) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });

  const admin = createAdminClient();
  const body = await request.json();
  const { title, content, is_pinned } = body;

  if (!title || !content) {
    return NextResponse.json({ error: '제목과 내용은 필수입니다' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('notices')
    .insert({ title, content, is_pinned: is_pinned ?? false })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
