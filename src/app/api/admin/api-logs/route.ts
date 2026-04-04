import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  if (!(await isAdmin(user.id))) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const since = searchParams.get('since');

  const admin = createAdminClient();
  let query = admin
    .from('api_call_logs')
    .select('endpoint, duration_ms, success, error_msg, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (since) query = query.gte('created_at', since);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [] });
}
