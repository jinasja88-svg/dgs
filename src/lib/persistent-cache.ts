import { createAdminClient } from '@/lib/supabase-admin';
import { LRUCache } from '@/lib/tmapi/cache';

const memoryCache = new LRUCache(500);

export async function getCached<T>(key: string): Promise<T | null> {
  const memHit = memoryCache.get<T>(key);
  if (memHit !== null) return memHit;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('api_cache')
      .select('value, expires_at')
      .eq('cache_key', key)
      .single();

    if (!data) return null;
    const expiresMs = new Date(data.expires_at).getTime();
    if (expiresMs < Date.now()) return null;

    memoryCache.set(key, data.value, expiresMs - Date.now());
    return data.value as T;
  } catch {
    return null;
  }
}

export async function setCached<T>(key: string, value: T, ttlMs: number): Promise<void> {
  memoryCache.set(key, value, ttlMs);
  try {
    const supabase = createAdminClient();
    const expiresAt = new Date(Date.now() + ttlMs).toISOString();
    await supabase
      .from('api_cache')
      .upsert({ cache_key: key, value, expires_at: expiresAt }, { onConflict: 'cache_key' });
  } catch {
    // L2 실패 시 L1만 사용
  }
}
