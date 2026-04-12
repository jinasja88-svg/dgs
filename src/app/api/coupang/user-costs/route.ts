import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('coupang_user_costs')
    .select('coupang_product_id, import_cost')
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // product_id -> import_cost 맵으로 변환
  const costMap: Record<string, number> = {};
  for (const row of data || []) {
    costMap[row.coupang_product_id] = row.import_cost;
  }

  return NextResponse.json({ costs: costMap });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const body = await request.json();
  const { coupang_product_id, import_cost } = body;

  if (!coupang_product_id || typeof import_cost !== 'number') {
    return NextResponse.json({ error: 'coupang_product_id와 import_cost가 필요합니다' }, { status: 400 });
  }

  const { error } = await supabase
    .from('coupang_user_costs')
    .upsert(
      {
        user_id: user.id,
        coupang_product_id,
        import_cost,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,coupang_product_id' }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
