import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = createAdminClient();

    // product_ids GIN 인덱스로 해당 상품 리뷰만 바로 조회
    const { data: reviews, error: reviewsError } = await supabase
      .from('sourcing_reviews')
      .select('id, rating, comment, created_at')
      .contains('product_ids', [id])
      .order('created_at', { ascending: false })
      .limit(50);

    if (reviewsError) throw reviewsError;

    return NextResponse.json({ reviews: reviews ?? [] });
  } catch (err) {
    console.error('Site reviews error:', err);
    return NextResponse.json({ reviews: [] });
  }
}
