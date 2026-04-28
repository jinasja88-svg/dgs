import { NextResponse, type NextRequest } from 'next/server';
import { CACHE_TTL, mapItemDetailToSourcingProduct, getCachedItemDetail } from '@/lib/tmapi';
import { getExchangeRate } from '@/lib/exchange-rate';
import { getCached, setCached } from '@/lib/persistent-cache';
import type { SourcingProduct } from '@/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cacheKey = `tmapi:product:${id}`;
  const cached = await getCached<SourcingProduct>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    // 환율 + TMAPI 상세(한국어) 병렬 실행. detail-raw 캐시는 product-desc와 공유됨.
    const [exchangeRate, detail] = await Promise.all([
      getExchangeRate(),
      getCachedItemDetail(id, 'ko'),
    ]);

    const product = mapItemDetailToSourcingProduct(detail, exchangeRate);

    await setCached(cacheKey, product, CACHE_TTL.DETAIL);

    return NextResponse.json(product);
  } catch (err) {
    console.error('Product detail error:', err);
    const message = err instanceof Error ? err.message : '상품을 찾을 수 없습니다';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
