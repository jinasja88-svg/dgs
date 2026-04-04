import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });

  const { data, error } = await supabase
    .from('cs_inquiries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });

  const body = await request.json();
  const { order_id, category, title, content } = body;

  if (!category || !title || !content) {
    return NextResponse.json({ error: '필수 항목이 누락되었습니다' }, { status: 400 });
  }

  if (order_id) {
    const { data: order } = await supabase
      .from('sourcing_orders')
      .select('id')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single();

    if (!order) return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('cs_inquiries')
    .insert({ user_id: user.id, order_id: order_id ?? null, category, title, content })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
