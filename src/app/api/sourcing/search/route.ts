import { NextResponse, type NextRequest } from 'next/server';
import { getTmapiClient, tmapiCache, CACHE_TTL, mapSearchItemToSourcingProduct } from '@/lib/tmapi';
import { getExchangeRate } from '@/lib/exchange-rate';
import { logApiCall } from '@/lib/api-logger';
import { translateProducts, translateSearchQuery } from '@/lib/translation';

const CATEGORY_KEYWORD_MAP: Record<string, string> = {
  '의류/패션': '服装',
  '전자기기': '电子产品',
  '가정/생활': '家居用品',
  '뷰티/미용': '美妆',
  '식품/건강': '食品保健',
  '스포츠/레저': '运动户外',
  '자동차/오토바이': '汽车用品',
  '완구/취미': '玩具',
  '사무/문구': '办公文具',
  '반려동물': '宠物用品',
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = Math.min(parseInt(searchParams.get('per_page') || '20'), 20);

  // 검색 키워드 조합 (한국어 키워드는 중국어로 번역)
  let searchKeyword = await translateSearchQuery(keyword);
  if (category && CATEGORY_KEYWORD_MAP[category]) {
    const catKeyword = CATEGORY_KEYWORD_MAP[category];
    searchKeyword = searchKeyword ? `${searchKeyword} ${catKeyword}` : catKeyword;
  }
  if (!searchKeyword) {
    searchKeyword = '热销产品';
  }

  // 캐시 확인
  const cacheKey = `search:${searchKeyword}:${page}:${perPage}`;
  const cached = tmapiCache.get<unknown>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const client = getTmapiClient();

    // 환율 조회 + TMAPI 검색 병렬 실행
    const [exchangeRate, result] = await Promise.all([
      getExchangeRate(),
      logApiCall('search', () =>
        client.searchByKeyword({ keyword: searchKeyword, page, page_size: perPage })
      ),
    ]);

    let products = result.items.map((item) =>
      mapSearchItemToSourcingProduct(item, exchangeRate)
    );

    if (category) {
      for (const p of products) {
        p.category = category;
      }
    }

    // 검색 목록은 SKU 표시 안 하므로 title만 번역
    products = await translateProducts(products, { skipSkus: true });

    const responseBody = {
      data: products,
      total: result.total_count || products.length,
      page,
      per_page: perPage,
      total_pages: Math.ceil((result.total_count || products.length) / perPage),
    };

    tmapiCache.set(cacheKey, responseBody, CACHE_TTL.SEARCH);

    return NextResponse.json(responseBody);
  } catch (err) {
    console.error('Search error:', err);
    const message = err instanceof Error ? err.message : '상품 검색 중 오류가 발생했습니다';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
