import { NextResponse, type NextRequest } from 'next/server';
import { getTmapiClient, CACHE_TTL, mapImageSearchItemToSourcingProduct } from '@/lib/tmapi';
import { getExchangeRate } from '@/lib/exchange-rate';
import { logApiCall } from '@/lib/api-logger';
import { getCached, setCached } from '@/lib/persistent-cache';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { consumeDailyQuota } from '@/lib/usage-quota';
import { createHash } from 'node:crypto';

export async function POST(request: NextRequest) {
  // 캐시 미스마다 유료 TMAPI 호출이 발생하므로 로그인 사용자만 허용
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '이미지 검색은 로그인 후 이용할 수 있습니다.' }, { status: 401 });
  }

  let body: { image_url?: string; page?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 });
  }

  const { image_url, page = 1 } = body;
  if (!image_url || typeof image_url !== 'string') {
    return NextResponse.json({ error: 'image_url은 필수입니다' }, { status: 400 });
  }
  if (!/^https:\/\//.test(image_url) && !image_url.startsWith('data:image/')) {
    return NextResponse.json({ error: '지원하지 않는 이미지 주소입니다' }, { status: 400 });
  }

  // 캐시 확인
  // base64 업로드 이미지도 들어오므로 원문 대신 해시를 키로 사용
  const imageHash = createHash('sha256').update(image_url).digest('hex');
  const cacheKey = `tmapi:img-search:${imageHash}:${page}`;
  const cached = await getCached<unknown>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  if (!(await consumeDailyQuota(user.id, 'image-search'))) {
    return NextResponse.json({ error: '오늘 이미지 검색 한도를 모두 사용했습니다. 내일 다시 시도해주세요.' }, { status: 429 });
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

    await setCached(cacheKey, responseBody, CACHE_TTL.IMAGE_SEARCH);

    return NextResponse.json(responseBody);
  } catch (err) {
    console.error('Image search error:', err);
    const message = err instanceof Error ? err.message : '이미지 검색 중 오류가 발생했습니다';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
