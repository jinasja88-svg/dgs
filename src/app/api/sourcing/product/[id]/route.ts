import { NextResponse, type NextRequest } from 'next/server';
import { getItemDetail, mapDetailToProduct } from '@/lib/ali1688';
import { getExchangeRate } from '@/lib/exchange-rate';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const exchangeRate = await getExchangeRate();
    const detail = await getItemDetail(id);

    if (!detail) {
      return NextResponse.json({ error: '상품을 찾을 수 없습니다.' }, { status: 404 });
    }

    const product = mapDetailToProduct(detail, exchangeRate);
    return NextResponse.json(product);
  } catch (err) {
    console.error('Product detail error:', err);
    const message = err instanceof Error ? err.message : '상품을 찾을 수 없습니다';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
