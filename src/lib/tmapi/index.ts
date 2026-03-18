import { TmapiClient } from './client';
import { LRUCache } from './cache';

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

export const tmapiCache = new LRUCache(500);
