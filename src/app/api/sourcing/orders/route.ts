import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { generateOrderNumber } from '@/lib/utils';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('sourcing_orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { items, total_cny, total_krw, service_fee, shipping_fee, shipping_address } = body as {
    items: Array<{ product_id: string; title: string; image: string; sku_name?: string; quantity: number; price_cny: number; price_krw: number }>;
    total_cny: number;
    total_krw: number;
    service_fee: number;
    shipping_fee: number;
    shipping_address: Record<string, string> | null;
  };

  // 입력값 검증
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: '주문 상품이 없습니다.' }, { status: 400 });
  }

  for (const item of items) {
    if (!item.product_id || !item.title || typeof item.quantity !== 'number' || item.quantity < 1) {
      return NextResponse.json({ error: '상품 정보가 올바르지 않습니다.' }, { status: 400 });
    }
    if (typeof item.price_cny !== 'number' || item.price_cny <= 0 || typeof item.price_krw !== 'number' || item.price_krw <= 0) {
      return NextResponse.json({ error: '상품 가격이 올바르지 않습니다.' }, { status: 400 });
    }
  }

  if (typeof total_krw !== 'number' || total_krw <= 0) {
    return NextResponse.json({ error: '총 금액이 올바르지 않습니다.' }, { status: 400 });
  }

  // 최근 10초 내 동일 사용자의 주문이 있는지 확인 (중복 방지)
  const { data: recentOrder } = await supabase
    .from('sourcing_orders')
    .select('id')
    .eq('user_id', user.id)
    .gte('created_at', new Date(Date.now() - 10000).toISOString())
    .limit(1)
    .single();

  if (recentOrder) {
    return NextResponse.json({ error: '잠시 후 다시 시도해주세요. (중복 주문 방지)' }, { status: 429 });
  }

  const { data, error } = await supabase
    .from('sourcing_orders')
    .insert({
      user_id: user.id,
      order_number: generateOrderNumber(),
      items,
      total_cny: total_cny || 0,
      total_krw,
      service_fee: service_fee || 0,
      shipping_fee: shipping_fee || 3000,
      shipping_address: shipping_address || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
