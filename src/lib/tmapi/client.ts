import { TmapiError, TmapiRateLimitError, TmapiAuthError } from './errors';
import type {
  TmapiResponse,
  TmapiSearchResult,
  TmapiItemDetail,
  TmapiImageSearchResult,
  TmapiItemRatingsResult,
  TmapiSearchParams,
  TmapiImageSearchParams,
} from './types';

const BASE_URL = 'https://api.tmapi.io';
const TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

export class TmapiClient {
  private apiToken: string;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  private async request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(path, BASE_URL);
    url.searchParams.set('apiToken', this.apiToken);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const res = await fetch(url.toString(), { signal: controller.signal });
        clearTimeout(timeout);

        if (res.status === 439) {
          lastError = new TmapiRateLimitError();
          continue; // retry on rate limit
        }

        if (res.status === 417 || res.status === 422) {
          throw new TmapiAuthError(res.status);
        }

        if (!res.ok) {
          throw new TmapiError(`TMAPI error: ${res.status}`, res.status);
        }

        const json: TmapiResponse<T> = await res.json();
        return json.data;
      } catch (err) {
        if (err instanceof TmapiAuthError) throw err;
        if (err instanceof TmapiError && !(err instanceof TmapiRateLimitError)) throw err;
        if (err instanceof DOMException && err.name === 'AbortError') {
          lastError = new TmapiError('Request timeout', 408);
          continue;
        }
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < MAX_RETRIES) continue;
      }
    }

    throw lastError || new TmapiError('Unknown error', 500);
  }

  async searchByKeyword(params: TmapiSearchParams): Promise<TmapiSearchResult> {
    return this.request<TmapiSearchResult>('/1688/search/items', {
      keyword: params.keyword,
      page: String(params.page || 1),
      page_size: String(Math.min(params.page_size || 20, 20)),
      ...(params.sort ? { sort: params.sort } : {}),
    });
  }

  async getItemDetail(itemId: string, language?: string): Promise<TmapiItemDetail> {
    return this.request<TmapiItemDetail>('/1688/item_detail', {
      item_id: itemId,
      language: language || 'ko',
    });
  }

  async getItemRatings(itemId: string): Promise<TmapiItemRatingsResult> {
    return this.request<TmapiItemRatingsResult>('/1688/item_ratings', {
      item_id: itemId,
    });
  }

  async searchByImage(params: TmapiImageSearchParams): Promise<TmapiImageSearchResult> {
    return this.request<TmapiImageSearchResult>('/1688/search/image', {
      img_url: params.img_url,
      page: String(params.page || 1),
      page_size: String(Math.min(params.page_size || 20, 20)),
    });
  }
}
