import { NextResponse, type NextRequest } from 'next/server';
import { getTmapiClient, tmapiCache, CACHE_TTL, mapItemDetailToSourcingProduct } from '@/lib/tmapi';
import { getExchangeRate } from '@/lib/exchange-rate';
import { logApiCall } from '@/lib/api-logger';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 캐시 확인
  const cacheKey = `detail:${id}`;
  const cached = tmapiCache.get<unknown>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const client = getTmapiClient();

    // 환율 + TMAPI 상세(한국어) 병렬 실행
    // TMAPI language=ko가 제목/SKU 속성을 한국어로 반환하므로 Papago 번역 불필요
    const [exchangeRate, detail] = await Promise.all([
      getExchangeRate(),
      logApiCall('product', () => client.getItemDetail(id, 'ko')),
    ]);

    const product = mapItemDetailToSourcingProduct(detail, exchangeRate);

    tmapiCache.set(cacheKey, product, CACHE_TTL.DETAIL);

    return NextResponse.json(product);
  } catch (err) {
    console.error('Product detail error:', err);
    const message = err instanceof Error ? err.message : '상품을 찾을 수 없습니다';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
