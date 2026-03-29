import { NextResponse, type NextRequest } from 'next/server';
import { getTmapiClient, tmapiCache, CACHE_TTL, mapItemDetailToSourcingProduct } from '@/lib/tmapi';
import { getExchangeRate } from '@/lib/exchange-rate';
import { logApiCall } from '@/lib/api-logger';
import { translateProducts } from '@/lib/translation';

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
    const exchangeRate = await getExchangeRate();
    const detail = await logApiCall('product', () => client.getItemDetail(id));

    const product = mapItemDetailToSourcingProduct(detail, exchangeRate);
    const [translated] = await translateProducts([product]);

    tmapiCache.set(cacheKey, translated, CACHE_TTL.DETAIL);

    return NextResponse.json(translated);
  } catch (err) {
    console.error('Product detail error:', err);
    const message = err instanceof Error ? err.message : '상품을 찾을 수 없습니다';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
