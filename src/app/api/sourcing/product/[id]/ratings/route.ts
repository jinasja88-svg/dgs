import { NextResponse, type NextRequest } from 'next/server';
import { getTmapiClient, tmapiCache, CACHE_TTL } from '@/lib/tmapi';
import { logApiCall } from '@/lib/api-logger';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cacheKey = `ratings:${id}`;
  const cached = tmapiCache.get<unknown>(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const client = getTmapiClient();
    const result = await logApiCall('ratings', () => client.getItemRatings(id));
    const rawRatings = result?.list ?? [];

    // TMAPI는 중국어 반환 → content를 한국어로 번역, 원문은 content_zh에 보존
    const translated = rawRatings.map((r) => ({
      content: r.feedback,
      star: Number(r.rate_star),
      time: r.feedback_date,
      sku_info: r.sku_map,
      images: r.images,
      user_name: r.user_nick,
    }));

    const response = { ratings: translated };
    tmapiCache.set(cacheKey, response, CACHE_TTL.RATINGS);
    return NextResponse.json(response);
  } catch (err) {
    console.error('Ratings error:', err);
    return NextResponse.json({ ratings: [] });
  }
}
