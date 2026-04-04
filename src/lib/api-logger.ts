import { createAdminClient } from './supabase-admin';

type Endpoint = 'search' | 'image-search' | 'product' | 'detail-generate' | 'ratings';

/**
 * 1688 API 호출을 실행하고 결과를 api_call_logs 테이블에 기록한다.
 * 로깅 실패는 메인 응답에 영향을 주지 않는다.
 */
export async function logApiCall<T>(
  endpoint: Endpoint,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  let success = true;
  let errorMsg: string | null = null;

  try {
    const result = await fn();
    return result;
  } catch (err) {
    success = false;
    errorMsg = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    const duration = Date.now() - start;
    try {
      const supabase = createAdminClient();
      await supabase.from('api_call_logs').insert({
        endpoint,
        duration_ms: duration,
        success,
        error_msg: errorMsg,
      });
    } catch {
      // 로깅 실패는 무시
    }
  }
}
