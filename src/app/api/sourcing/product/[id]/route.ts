import { NextResponse, type NextRequest } from 'next/server';
import {
  getTmapiClient,
  tmapiCache,
  CACHE_TTL,
  mapItemDetailToSourcingProduct,
  TmapiRateLimitError,
  TmapiAuthError,
  TmapiError,
} from '@/lib/tmapi';
import { getExchangeRate } from '@/lib/exchange-rate';
import type { TmapiItemDetail } from '@/lib/tmapi';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cacheKey = `detail:${id}`;
  const cached = tmapiCache.get<TmapiItemDetail>(cacheKey);

  try {
    const exchangeRate = await getExchangeRate();

    let detail: TmapiItemDetail;
    if (cached) {
      detail = cached;
    } else {
      const client = getTmapiClient();
      detail = await client.getItemDetail(id, 'ko');
      tmapiCache.set(cacheKey, detail, CACHE_TTL.DETAIL);
    }

    const product = mapItemDetailToSourcingProduct(detail, exchangeRate);
    return NextResponse.json(product);
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
    console.error('Product detail error:', err);
    return NextResponse.json(
      { error: '상품을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }
}
