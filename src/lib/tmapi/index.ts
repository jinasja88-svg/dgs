import { TmapiClient } from './client';
import { CACHE_TTL } from './cache';
import { logApiCall } from '@/lib/api-logger';
import { getCached, setCached } from '@/lib/persistent-cache';
import type { TmapiItemDetail } from './types';

export { TmapiClient } from './client';
export { LRUCache, CACHE_TTL } from './cache';
export { TmapiError, TmapiRateLimitError, TmapiAuthError } from './errors';
export {
  mapSearchItemToSourcingProduct,
  mapItemDetailToSourcingProduct,
  mapImageSearchItemToSourcingProduct,
} from './mapper';
export type * from './types';

// Singleton instances
let clientInstance: TmapiClient | null = null;

export function getTmapiClient(): TmapiClient {
  if (!clientInstance) {
    const token = process.env.TMAPI_API_TOKEN;
    if (!token) {
      throw new Error('TMAPI_API_TOKEN is not set');
    }
    clientInstance = new TmapiClient(token);
  }
  return clientInstance;
}

/**
 * 동일 (item_id, language) 동시 요청을 1번의 TMAPI 호출로 합쳐 비용 절감.
 * 영구 캐시(api_cache) → 인메모리 → in-flight dedupe → TMAPI 순으로 조회.
 */
const inflightItemDetail = new Map<string, Promise<TmapiItemDetail>>();

export async function getCachedItemDetail(
  itemId: string,
  language: string = 'ko'
): Promise<TmapiItemDetail> {
  const cacheKey = `tmapi:detail-raw:${itemId}:${language}`;

  const cached = await getCached<TmapiItemDetail>(cacheKey);
  if (cached) return cached;

  const existing = inflightItemDetail.get(cacheKey);
  if (existing) return existing;

  const client = getTmapiClient();
  const promise = logApiCall('product', () => client.getItemDetail(itemId, language))
    .then(async (detail) => {
      await setCached(cacheKey, detail, CACHE_TTL.DETAIL);
      return detail;
    })
    .finally(() => {
      inflightItemDetail.delete(cacheKey);
    });

  inflightItemDetail.set(cacheKey, promise);
  return promise;
}
