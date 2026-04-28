import { NextResponse, type NextRequest } from 'next/server';
import { getTmapiClient, CACHE_TTL } from '@/lib/tmapi';
import { logApiCall } from '@/lib/api-logger';
import { translateBatch } from '@/lib/translation';
import { getCached, setCached } from '@/lib/persistent-cache';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cacheKey = `tmapi:ratings:${id}`;
  const cached = await getCached<unknown>(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const client = getTmapiClient();
    const result = await logApiCall('ratings', () => client.getItemRatings(id));
    const rawRatings = result?.list ?? [];

    // 리뷰 본문을 단일 배치 호출로 번역 (캐시 히트는 자동 스킵)
    const feedbackTexts = rawRatings.map((r) => r.feedback ?? '');
    const translatedTexts = await translateBatch(feedbackTexts);

    const translated = rawRatings.map((r, i) => ({
      content: translatedTexts[i] || r.feedback,
      content_zh: r.feedback,
      star: Number(r.rate_star),
      time: r.feedback_date,
      sku_info: r.sku_map,
      images: r.images,
      user_name: r.user_nick,
    }));

    const response = { ratings: translated };
    await setCached(cacheKey, response, CACHE_TTL.RATINGS);
    return NextResponse.json(response);
  } catch (err) {
    console.error('Ratings error:', err);
    return NextResponse.json({ ratings: [] });
  }
}
