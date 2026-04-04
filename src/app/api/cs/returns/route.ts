import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });

  const { data, error } = await supabase
    .from('cs_returns')
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
  const { order_id, return_type, reason, detail } = body;

  if (!order_id || !return_type || !reason || !detail) {
    return NextResponse.json({ error: '필수 항목이 누락되었습니다' }, { status: 400 });
  }

  // 1. Verify order ownership
  const { data: order } = await supabase
    .from('sourcing_orders')
    .select('id, status')
    .eq('id', order_id)
    .eq('user_id', user.id)
    .single();

  if (!order) return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 });

  // 2. Check order status
  if (order.status !== 'delivered') {
    return NextResponse.json({ error: '배송 완료된 주문만 반품/교환 신청이 가능합니다' }, { status: 400 });
  }

  // 3. Check for existing return
  const { data: existing } = await supabase
    .from('cs_returns')
    .select('id')
    .eq('order_id', order_id)
    .single();

  if (existing) {
    return NextResponse.json({ error: '이미 반품/교환 신청이 접수된 주문입니다' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('cs_returns')
    .insert({ user_id: user.id, order_id, return_type, reason, detail })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
