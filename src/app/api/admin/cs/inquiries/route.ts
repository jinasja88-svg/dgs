import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  if (!(await isAdmin(user.id))) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });

  const admin = createAdminClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const per_page = Math.max(1, parseInt(searchParams.get('per_page') ?? '20', 10));
  const from = (page - 1) * per_page;
  const to = from + per_page - 1;

  let query = admin
    .from('cs_inquiries')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('status', status);
  if (category) query = query.eq('category', category);

  const { data: inquiries, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = inquiries ?? [];

  // Two-step profile join: cs_inquiries.user_id references auth.users, not profiles directly
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
  const profileMap: Record<string, { name: string | null; email: string | null }> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, name, email')
      .in('id', userIds);

    for (const p of profiles ?? []) {
      profileMap[p.id] = { name: p.name ?? null, email: p.email ?? null };
    }
  }

  const data = rows.map((row) => ({
    ...row,
    profile: profileMap[row.user_id] ?? { name: null, email: null },
  }));

  const total = count ?? 0;
  const total_pages = Math.ceil(total / per_page);

  return NextResponse.json({ data, total, page, per_page, total_pages });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  if (!(await isAdmin(user.id))) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });

  const admin = createAdminClient();
  const body = await request.json();
  const { id, status, admin_reply } = body;

  if (!id) return NextResponse.json({ error: 'id가 필요합니다' }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status !== undefined) updates.status = status;
  if (admin_reply !== undefined) {
    updates.admin_reply = admin_reply;
    updates.admin_replied_at = new Date().toISOString();
  }

  const { data, error } = await admin
    .from('cs_inquiries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
