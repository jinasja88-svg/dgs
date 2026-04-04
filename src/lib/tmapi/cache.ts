interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class LRUCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize: number;

  constructor(maxSize = 500) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }
}

// TTL constants
export const CACHE_TTL = {
  SEARCH: 5 * 60 * 1000,       // 5 minutes
  DETAIL: 15 * 60 * 1000,      // 15 minutes
  IMAGE_SEARCH: 10 * 60 * 1000, // 10 minutes
  RATINGS: 30 * 60 * 1000,      // 30 minutes
} as const;
