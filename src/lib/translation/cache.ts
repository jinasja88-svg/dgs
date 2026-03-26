import { LRUCache } from '@/lib/tmapi/cache';

// 번역 캐시: 최대 2000개 항목, TTL 24시간
export const translationCache = new LRUCache(2000);

export const TRANSLATION_TTL = 24 * 60 * 60 * 1000; // 24h

export function getCached(text: string, direction: 'zh2ko' | 'ko2zh'): string | null {
  return translationCache.get<string>(`${direction}:${text}`);
}

export function setCached(text: string, direction: 'zh2ko' | 'ko2zh', translated: string): void {
  translationCache.set(`${direction}:${text}`, translated, TRANSLATION_TTL);
}
