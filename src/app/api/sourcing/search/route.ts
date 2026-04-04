import { NextResponse, type NextRequest } from 'next/server';
import { getTmapiClient, tmapiCache, CACHE_TTL, mapSearchItemToSourcingProduct } from '@/lib/tmapi';
import { getExchangeRate } from '@/lib/exchange-rate';
import { logApiCall } from '@/lib/api-logger';
import { translateProducts, translateSearchQuery } from '@/lib/translation';
import type { SourcingProduct } from '@/types';

type SortOption = 'recommend' | 'sales' | 'price_up' | 'price_down' | 'rating' | 'repurchase';

/** TMAPI에 전달할 sort 파라미터 매핑 */
function getTmapiSort(sort: SortOption): 'default' | 'sales' | 'price_up' | 'price_down' {
  if (sort === 'sales' || sort === 'price_up' || sort === 'price_down') return sort;
  return 'default';
}

/** 판매자 품질 복합 점수 (0~1). 지표가 전혀 없으면 -1 반환하여 원래 순서 유지 */
function sellerQualityScore(product: SourcingProduct, maxSales: number): number {
  const s = product.seller;
  if (!s) return -1;
  const hasAny = s.rating != null || s.repurchase_rate != null || s.is_super_factory || s.sales_90d != null;
  if (!hasAny) return -1;

  const ratingNorm = s.rating ? Math.min(s.rating / 5, 1) : 0;
  const repurchaseNorm = s.repurchase_rate ? Math.min(s.repurchase_rate / 100, 1) : 0;
  const factoryBonus = s.is_super_factory ? 1 : 0;
  const salesNorm = s.sales_90d && maxSales > 0 ? Math.min(s.sales_90d / maxSales, 1) : 0;

  return ratingNorm * 0.4 + repurchaseNorm * 0.3 + factoryBonus * 0.2 + salesNorm * 0.1;
}

/** 후처리 정렬 적용 — 모든 정렬 옵션에서 표시 데이터 기준으로 재정렬 */
function applyPostSort(products: SourcingProduct[], sort: SortOption): void {
  if (sort === 'recommend') {
    const maxSales = Math.max(...products.map((p) => p.seller?.sales_90d ?? 0), 1);
    products.sort((a, b) => sellerQualityScore(b, maxSales) - sellerQualityScore(a, maxSales));
  } else if (sort === 'rating') {
    // 평점 있는 상품 우선, 그 안에서 평점 내림차순
    products.sort((a, b) => {
      const ra = a.seller?.rating;
      const rb = b.seller?.rating;
      if (ra == null && rb == null) return 0;
      if (ra == null) return 1;  // a 평점 없으면 뒤로
      if (rb == null) return -1; // b 평점 없으면 뒤로
      return rb - ra;
    });
  } else if (sort === 'repurchase') {
    // 재구매율 있는 상품 우선, 그 안에서 내림차순
    products.sort((a, b) => {
      const ra = a.seller?.repurchase_rate;
      const rb = b.seller?.repurchase_rate;
      if (ra == null && rb == null) return 0;
      if (ra == null) return 1;
      if (rb == null) return -1;
      return rb - ra;
    });
  } else if (sort === 'price_up') {
    // 표시 가격(price_cny) 기준 오름차순
    products.sort((a, b) => a.price_cny - b.price_cny);
  } else if (sort === 'price_down') {
    // 표시 가격(price_cny) 기준 내림차순
    products.sort((a, b) => b.price_cny - a.price_cny);
  }
  // sales는 TMAPI 서버 정렬만으로 충분
}

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
  const sort = (searchParams.get('sort') || 'recommend') as SortOption;

  // 검색 키워드 조합 (한국어 키워드는 중국어로 번역)
  let searchKeyword = await translateSearchQuery(keyword);
  if (category && CATEGORY_KEYWORD_MAP[category]) {
    const catKeyword = CATEGORY_KEYWORD_MAP[category];
    searchKeyword = searchKeyword ? `${searchKeyword} ${catKeyword}` : catKeyword;
  }
  // 키워드·카테고리 모두 없으면 인기 상품 우선 정렬
  const isDefaultSearch = !searchKeyword;
  if (isDefaultSearch) {
    searchKeyword = '热销产品';
  }

  // 캐시 확인
  const tmapiSort = (isDefaultSearch && sort === 'recommend') ? 'sales' : getTmapiSort(sort);
  const cacheKey = `search:${searchKeyword}:${page}:${perPage}:${sort}:${tmapiSort}`;
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
        client.searchByKeyword({ keyword: searchKeyword, page, page_size: perPage, sort: tmapiSort })
      ),
    ]);

    let products = result.items.map((item) =>
      mapSearchItemToSourcingProduct(item, exchangeRate)
    );

    // 후처리 정렬 적용
    applyPostSort(products, sort);

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
