import { createAdminClient } from '@/lib/supabase-admin';

export function getCached(_text: string, _direction: 'zh2ko' | 'ko2zh'): string | null {
  // Supabase 기반 캐시는 비동기이므로 getCachedAsync 사용
  return null;
}

export function setCached(_text: string, _direction: 'zh2ko' | 'ko2zh', _translated: string): void {
  // Supabase 기반 캐시는 비동기이므로 setCachedAsync 사용
}

export async function getCachedAsync(text: string, direction: 'zh2ko' | 'ko2zh'): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('translation_cache')
      .select('translated')
      .eq('direction', direction)
      .eq('original', text)
      .single();
    return data?.translated ?? null;
  } catch {
    return null;
  }
}

export async function setCachedAsync(text: string, direction: 'zh2ko' | 'ko2zh', translated: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase
      .from('translation_cache')
      .upsert({ original: text, direction, translated }, { onConflict: 'direction,original' });
  } catch {
    // 캐시 저장 실패는 무시
  }
}
