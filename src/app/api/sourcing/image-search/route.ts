import { NextResponse, type NextRequest } from 'next/server';
import { getTmapiClient, tmapiCache, CACHE_TTL, mapImageSearchItemToSourcingProduct } from '@/lib/tmapi';
import { getExchangeRate } from '@/lib/exchange-rate';
import { logApiCall } from '@/lib/api-logger';

export async function POST(request: NextRequest) {
  let body: { image_url?: string; page?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 });
  }

  const { image_url, page = 1 } = body;
  if (!image_url) {
    return NextResponse.json({ error: 'image_url은 필수입니다' }, { status: 400 });
  }

  // 캐시 확인
  const cacheKey = `img-search:${image_url}:${page}`;
  const cached = tmapiCache.get<unknown>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const client = getTmapiClient();
    const exchangeRate = await getExchangeRate();

    // TMAPI는 이미지 URL을 직접 받아서 검색 (base64 업로드 불필요)
    const result = await logApiCall('image-search', () =>
      client.searchByImage({ img_url: image_url, page, page_size: 20 })
    );

    const products = result.items.map((item) =>
      mapImageSearchItemToSourcingProduct(item, exchangeRate)
    );

    const responseBody = {
      data: products,
      total: result.total_count || products.length,
      page,
      per_page: 20,
      total_pages: Math.ceil((result.total_count || products.length) / 20),
    };

    tmapiCache.set(cacheKey, responseBody, CACHE_TTL.IMAGE_SEARCH);

    return NextResponse.json(responseBody);
  } catch (err) {
    console.error('Image search error:', err);
    const message = err instanceof Error ? err.message : '이미지 검색 중 오류가 발생했습니다';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
