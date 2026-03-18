import { NextResponse, type NextRequest } from 'next/server';
import {
  getTmapiClient,
  tmapiCache,
  CACHE_TTL,
  mapSearchItemToSourcingProduct,
  TmapiRateLimitError,
  TmapiAuthError,
  TmapiError,
} from '@/lib/tmapi';
import { getExchangeRate } from '@/lib/exchange-rate';
import type { TmapiSearchResult } from '@/lib/tmapi';

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

  // Build search keyword: user keyword + category mapping
  let searchKeyword = keyword;
  if (category && CATEGORY_KEYWORD_MAP[category]) {
    const catKeyword = CATEGORY_KEYWORD_MAP[category];
    searchKeyword = keyword ? `${keyword} ${catKeyword}` : catKeyword;
  }

  if (!searchKeyword) {
    searchKeyword = '热销产品'; // default: trending products
  }

  const cacheKey = `search:${searchKeyword}:${page}:${perPage}`;
  const cached = tmapiCache.get<TmapiSearchResult>(cacheKey);

  try {
    const exchangeRate = await getExchangeRate();

    let result: TmapiSearchResult;
    if (cached) {
      result = cached;
    } else {
      const client = getTmapiClient();
      result = await client.searchByKeyword({
        keyword: searchKeyword,
        page,
        page_size: perPage,
      });
      tmapiCache.set(cacheKey, result, CACHE_TTL.SEARCH);
    }

    const products = (result.offerList || []).map((item) =>
      mapSearchItemToSourcingProduct(item, exchangeRate)
    );

    // If category was used, tag products with the category name
    if (category) {
      for (const p of products) {
        p.category = category;
      }
    }

    return NextResponse.json({
      data: products,
      total: result.totalCount || products.length,
      page,
      per_page: perPage,
      total_pages: Math.ceil((result.totalCount || products.length) / perPage),
    });
  } catch (err) {
    if (err instanceof TmapiRateLimitError) {
      return NextResponse.json(
        { error: '잠시 후 다시 시도해주세요' },
        { status: 429 }
      );
    }
    if (err instanceof TmapiAuthError) {
      console.error('TMAPI auth error:', err.statusCode);
      return NextResponse.json(
        { error: '서비스 오류가 발생했습니다' },
        { status: 500 }
      );
    }
    if (err instanceof TmapiError) {
      if (err.statusCode === 408) {
        return NextResponse.json(
          { error: '서버 응답 시간 초과' },
          { status: 504 }
        );
      }
      return NextResponse.json(
        { error: '상품 정보를 불러올 수 없습니다' },
        { status: 502 }
      );
    }
    console.error('Search error:', err);
    return NextResponse.json(
      { error: '상품 검색 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
