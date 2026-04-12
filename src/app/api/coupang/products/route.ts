import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import type { CoupangSortKey } from '@/lib/coupang/types';

const SORT_COLUMNS: Record<CoupangSortKey, string> = {
  view_count: 'view_count',
  estimated_monthly_sales: 'estimated_monthly_sales',
  estimated_monthly_revenue: 'estimated_monthly_revenue',
  price: 'price',
  review_count: 'review_count',
  buy_count: 'buy_count',
};

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const keyword = sp.get('keyword')?.trim() || '';
  const category = sp.get('category') || '';
  const minPrice = parseInt(sp.get('min_price') || '0') || 0;
  const maxPrice = parseInt(sp.get('max_price') || '0') || 0;
  const minViews = parseInt(sp.get('min_views') || '0') || 0;
  const minSales = parseInt(sp.get('min_sales') || '0') || 0;
  const maxReviews = parseInt(sp.get('max_reviews') || '0') || 0;
  const excludeBrands = sp.get('exclude_brands') !== 'false';
  const sortKey = (sp.get('sort') || 'view_count') as CoupangSortKey;
  const order = sp.get('order') === 'asc' ? true : false; // ascending = true
  const page = Math.max(1, parseInt(sp.get('page') || '1'));
  const perPage = Math.min(100, Math.max(1, parseInt(sp.get('per_page') || '50')));

  const supabase = createAdminClient();

  // 기본 쿼리
  let query = supabase
    .from('coupang_products')
    .select('*', { count: 'exact' });

  // 키워드 검색
  if (keyword) {
    query = query.or(
      `product_name.ilike.%${keyword}%,main_keyword.ilike.%${keyword}%,sub_keyword1.ilike.%${keyword}%,sub_keyword2.ilike.%${keyword}%`
    );
  }

  // 카테고리 필터
  if (category) {
    query = query.eq('category_l1', category);
  }

  // 가격 필터
  if (minPrice > 0) query = query.gte('price', minPrice);
  if (maxPrice > 0) query = query.lte('price', maxPrice);

  // 조회수 / 판매량 필터
  if (minViews > 0) query = query.gte('view_count', minViews);
  if (minSales > 0) query = query.gte('estimated_monthly_sales', minSales);

  // 최대 리뷰수 (포화 상품 제외)
  if (maxReviews > 0) query = query.lte('review_count', maxReviews);

  // 대기업 브랜드 제외
  if (excludeBrands) {
    query = query.eq('is_excluded_brand', false);
  }

  // 정렬
  const sortColumn = SORT_COLUMNS[sortKey] || 'view_count';
  query = query.order(sortColumn, { ascending: order, nullsFirst: false });

  // 페��지네이션
  const from = (page - 1) * perPage;
  query = query.range(from, from + perPage - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('Coupang products query error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data || [],
    total: count || 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count || 0) / perPage),
  });
}
