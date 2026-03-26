import { NextResponse, type NextRequest } from 'next/server';
import { getItemDetail, mapDetailToProduct } from '@/lib/ali1688';
import { getExchangeRate } from '@/lib/exchange-rate';
import { logApiCall } from '@/lib/api-logger';
import { translateProducts } from '@/lib/translation';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const exchangeRate = await getExchangeRate();
    const detail = await logApiCall('product', () => getItemDetail(id));

    if (!detail) {
      return NextResponse.json({ error: '상품을 찾을 수 없습니다.' }, { status: 404 });
    }

    const product = mapDetailToProduct(detail, exchangeRate);
    const [translated] = await translateProducts([product]);
    return NextResponse.json(translated);
  } catch (err) {
    console.error('Product detail error:', err);
    const message = err instanceof Error ? err.message : '상품을 찾을 수 없습니다';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
