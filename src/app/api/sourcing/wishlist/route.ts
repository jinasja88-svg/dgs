import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET /api/sourcing/wishlist — 로그인 유저의 찜 목록 조회
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('sourcing_wishlist_items')
    .select('*')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/sourcing/wishlist — 찜 추가
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  let body: {
    product_id: string;
    title: string;
    title_zh?: string;
    image?: string;
    price_krw?: number;
    price_cny?: number;
    seller_name?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 });
  }

  if (!body.product_id || !body.title) {
    return NextResponse.json({ error: 'product_id, title은 필수입니다' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('sourcing_wishlist_items')
    .upsert({
      user_id: user.id,
      product_id: body.product_id,
      title: body.title,
      title_zh: body.title_zh,
      image: body.image,
      price_krw: body.price_krw,
      price_cny: body.price_cny,
      seller_name: body.seller_name,
    }, { onConflict: 'user_id,product_id' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/sourcing/wishlist?product_id=xxx — 찜 삭제
export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const productId = request.nextUrl.searchParams.get('product_id');
  if (!productId) {
    return NextResponse.json({ error: 'product_id는 필수입니다' }, { status: 400 });
  }

  const { error } = await supabase
    .from('sourcing_wishlist_items')
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', productId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
