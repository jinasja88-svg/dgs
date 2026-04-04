import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = createAdminClient();

    // 해당 상품이 포함된 주문 ID 조회
    const { data: orders, error: ordersError } = await supabase
      .from('sourcing_orders')
      .select('id')
      .contains('items', [{ product_id: id }]);

    if (ordersError) throw ordersError;
    if (!orders || orders.length === 0) return NextResponse.json({ reviews: [] });

    const orderIds = orders.map((o) => o.id);

    // 해당 주문들의 리뷰 조회
    const { data: reviews, error: reviewsError } = await supabase
      .from('sourcing_reviews')
      .select('id, rating, comment, created_at')
      .in('order_id', orderIds)
      .order('created_at', { ascending: false });

    if (reviewsError) throw reviewsError;

    return NextResponse.json({ reviews: reviews ?? [] });
  } catch (err) {
    console.error('Site reviews error:', err);
    return NextResponse.json({ reviews: [] });
  }
}
