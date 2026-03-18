import { NextResponse, type NextRequest } from 'next/server';
import {
  getTmapiClient,
  tmapiCache,
  CACHE_TTL,
  mapImageSearchItemToSourcingProduct,
  TmapiRateLimitError,
  TmapiAuthError,
  TmapiError,
} from '@/lib/tmapi';
import { getExchangeRate } from '@/lib/exchange-rate';
import type { TmapiImageSearchResult } from '@/lib/tmapi';

function isAlibabaImage(url: string): boolean {
  return url.includes('alicdn.com') || url.includes('1688.com');
}

export async function POST(request: NextRequest) {
  let body: { image_url?: string; page?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: '잘못된 요청입니다' },
      { status: 400 }
    );
  }

  const { image_url, page = 1 } = body;
  if (!image_url) {
    return NextResponse.json(
      { error: 'image_url은 필수입니다' },
      { status: 400 }
    );
  }

  try {
    const client = getTmapiClient();
    const exchangeRate = await getExchangeRate();

    // Convert non-Alibaba images first
    let searchUrl = image_url;
    if (!isAlibabaImage(image_url)) {
      searchUrl = await client.convertImageUrl(image_url);
    }

    const cacheKey = `img:${searchUrl}:${page}`;
    const cached = tmapiCache.get<TmapiImageSearchResult>(cacheKey);

    let result: TmapiImageSearchResult;
    if (cached) {
      result = cached;
    } else {
      result = await client.searchByImage({ img_url: searchUrl, page });
      tmapiCache.set(cacheKey, result, CACHE_TTL.IMAGE_SEARCH);
    }

    const products = (result.data || []).map((item) =>
      mapImageSearchItemToSourcingProduct(item, exchangeRate)
    );

    const total = result.totalCount || products.length;
    const perPage = result.pageSize || 20;

    return NextResponse.json({
      data: products,
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
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
        { error: '이미지 검색에 실패했습니다' },
        { status: 502 }
      );
    }
    console.error('Image search error:', err);
    return NextResponse.json(
      { error: '이미지 검색 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
