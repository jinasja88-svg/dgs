import { createAdminClient } from '@/lib/supabase-admin';

export type QuotaFeature = 'image-search' | 'detail-generate';

// 기능별 사용자 1인당 일일 한도 (env로 조정 가능)
const DEFAULT_LIMITS: Record<QuotaFeature, number> = {
  'image-search': 50,
  'detail-generate': 10,
};

const ENV_KEYS: Record<QuotaFeature, string> = {
  'image-search': 'IMAGE_SEARCH_DAILY_LIMIT_PER_USER',
  'detail-generate': 'DETAIL_GENERATE_DAILY_LIMIT_PER_USER',
};

function getLimit(feature: QuotaFeature): number {
  const parsed = Number(process.env[ENV_KEYS[feature]]);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_LIMITS[feature];
}

function getKstDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// 테이블 미적용/일시 오류 시 최소 방어용 프로세스 메모리 카운터
const memoryUsage = new Map<string, number>();

/**
 * 사용자의 오늘 사용량을 1 올리고, 한도 이내면 true를 반환한다.
 * 유료 외부 API(TMAPI 이미지 검색, LLM 생성) 호출 직전에 사용.
 */
export async function consumeDailyQuota(userId: string, feature: QuotaFeature): Promise<boolean> {
  const limit = getLimit(feature);
  const today = getKstDate();
  const memKey = `${today}:${feature}:${userId}`;
  const memCount = memoryUsage.get(memKey) ?? 0;
  if (memCount >= limit) return false;
  memoryUsage.set(memKey, memCount + 1);

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('user_api_usage_daily')
      .select('calls')
      .eq('user_id', userId)
      .eq('usage_date', today)
      .eq('feature', feature)
      .maybeSingle();

    const calls = data?.calls ?? 0;
    if (calls >= limit) return false;

    await supabase
      .from('user_api_usage_daily')
      .upsert(
        { user_id: userId, usage_date: today, feature, calls: calls + 1, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,usage_date,feature' }
      );
  } catch {
    // 테이블 미적용 시 메모리 카운터만으로 동작
  }
  return true;
}
