import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET /api/sourcing/reviews?order_id=xxx
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });

  const orderId = request.nextUrl.searchParams.get('order_id');
  let query = supabase.from('sourcing_reviews').select('*').eq('user_id', user.id);
  if (orderId) query = query.eq('order_id', orderId);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/sourcing/reviews
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });

  let body: { order_id: string; rating: number; comment?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 });
  }

  if (!body.order_id || !body.rating || body.rating < 1 || body.rating > 5) {
    return NextResponse.json({ error: 'order_id와 rating(1~5)은 필수입니다' }, { status: 400 });
  }

  if (body.comment && body.comment.length > 500) {
    return NextResponse.json({ error: '리뷰는 500자 이내로 작성해주세요' }, { status: 400 });
  }

  // 주문 소유권 확인
  const { data: order } = await supabase
    .from('sourcing_orders')
    .select('id, status')
    .eq('id', body.order_id)
    .eq('user_id', user.id)
    .single();

  if (!order) return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 });
  if (order.status !== 'delivered') return NextResponse.json({ error: '배송 완료된 주문만 리뷰를 작성할 수 있습니다' }, { status: 400 });

  // 중복 리뷰 확인
  const { data: existing } = await supabase
    .from('sourcing_reviews')
    .select('id')
    .eq('order_id', body.order_id)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: '이미 리뷰를 작성하셨습니다' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('sourcing_reviews')
    .insert({
      order_id: body.order_id,
      user_id: user.id,
      rating: body.rating,
      comment: body.comment?.trim() || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
