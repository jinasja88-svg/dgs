import { NextResponse, type NextRequest } from 'next/server';
import { runKeywordSearch, type SortOption } from '@/lib/sourcing/search';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = Math.min(parseInt(searchParams.get('per_page') || '10'), 20);
  const sort = (searchParams.get('sort') || 'recommend') as SortOption;

  try {
    const responseBody = await runKeywordSearch({ keyword, category, page, perPage, sort });
    return NextResponse.json(responseBody);
  } catch (err) {
    console.error('Search error:', err);
    const message = err instanceof Error ? err.message : '상품 검색 중 오류가 발생했습니다';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
