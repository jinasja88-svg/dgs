import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET /api/sourcing/search-history — 최근 검색어 조회 (최대 10개)
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from('search_history')
    .select('id, keyword, searched_at')
    .eq('user_id', user.id)
    .order('searched_at', { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json([]);
  }

  // 중복 키워드 제거 (최신 것만 유지)
  const seen = new Set<string>();
  const unique = (data ?? []).filter((item) => {
    if (seen.has(item.keyword)) return false;
    seen.add(item.keyword);
    return true;
  });

  return NextResponse.json(unique);
}

// POST /api/sourcing/search-history — 검색어 저장
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false });
  }

  let body: { keyword: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 });
  }

  if (!body.keyword?.trim()) {
    return NextResponse.json({ error: 'keyword는 필수입니다' }, { status: 400 });
  }

  await supabase.from('search_history').insert({
    user_id: user.id,
    keyword: body.keyword.trim(),
  });

  // 오래된 검색어 정리 (20개 초과 시 삭제)
  const { data: old } = await supabase
    .from('search_history')
    .select('id')
    .eq('user_id', user.id)
    .order('searched_at', { ascending: false })
    .range(20, 1000);

  if (old && old.length > 0) {
    await supabase
      .from('search_history')
      .delete()
      .in('id', old.map((r) => r.id));
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/sourcing/search-history?keyword=xxx — 특정 검색어 삭제
// DELETE /api/sourcing/search-history (body 없이) — 전체 삭제
export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const keyword = request.nextUrl.searchParams.get('keyword');

  if (keyword) {
    await supabase
      .from('search_history')
      .delete()
      .eq('user_id', user.id)
      .eq('keyword', keyword);
  } else {
    await supabase
      .from('search_history')
      .delete()
      .eq('user_id', user.id);
  }

  return NextResponse.json({ ok: true });
}
