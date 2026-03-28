import { NextResponse, type NextRequest } from 'next/server';
import {
  uploadImage,
  searchByImage,
  imageUrlToBase64,
  mapSearchItemToProduct,
} from '@/lib/ali1688';
import { getExchangeRate } from '@/lib/exchange-rate';
import { logApiCall } from '@/lib/api-logger';
import { translateProducts } from '@/lib/translation';

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

  try {
    const exchangeRate = await getExchangeRate();

    // 이미지를 base64로 변환
    const base64 = await imageUrlToBase64(image_url);

    // Step 1: 이미지 업로드 → imageId 획득 / Step 2: 유사 상품 검색
    const result = await logApiCall('image-search', async () => {
      const { imageId, sessionId, requestId } = await uploadImage(base64);
      return searchByImage({ imageId, sessionId, requestId, page, pageSize: 40 });
    });

    const rawProducts = result.offerList.map((item) =>
      mapSearchItemToProduct(item, exchangeRate)
    );
    const products = await translateProducts(rawProducts, { skipSkus: true });

    return NextResponse.json({
      data: products,
      total: products.length,
      page,
      per_page: 40,
      total_pages: result.pageCount || 1,
    });
  } catch (err) {
    console.error('Image search error:', err);
    const message = err instanceof Error ? err.message : '이미지 검색 중 오류가 발생했습니다';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
