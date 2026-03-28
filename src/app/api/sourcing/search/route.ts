import { NextResponse, type NextRequest } from 'next/server';
import { searchByKeyword, mapSearchItemToProduct } from '@/lib/ali1688';
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
  const perPage = Math.min(parseInt(searchParams.get('per_page') || '50'), 50);

  // 검색 키워드 조합 (한국어 키워드는 중국어로 번역)
  let searchKeyword = await translateSearchQuery(keyword);
  if (category && CATEGORY_KEYWORD_MAP[category]) {
    const catKeyword = CATEGORY_KEYWORD_MAP[category];
    searchKeyword = searchKeyword ? `${searchKeyword} ${catKeyword}` : catKeyword;
  }
  if (!searchKeyword) {
    searchKeyword = '热销产品';
  }

  try {
    const exchangeRate = await getExchangeRate();

    const result = await logApiCall('search', () =>
      searchByKeyword({ keyword: searchKeyword, page, pageSize: perPage })
    );

    let products = result.offerList.map((item) =>
      mapSearchItemToProduct(item, exchangeRate)
    );

    if (category) {
      for (const p of products) {
        p.category = category;
      }
    }

    products = await translateProducts(products);

    return NextResponse.json({
      data: products,
      total: result.totalCount || products.length,
      page,
      per_page: perPage,
      total_pages: result.pageCount || Math.ceil((result.totalCount || products.length) / perPage),
    });
  } catch (err) {
    console.error('Search error:', err);
    const message = err instanceof Error ? err.message : '상품 검색 중 오류가 발생했습니다';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
