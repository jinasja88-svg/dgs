import { createAdminClient } from './supabase-admin';

/**
 * 주어진 userId의 profiles.role이 'admin'인지 확인합니다.
 * API 라우트에서 관리자 권한 검증에 사용하세요.
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role === 'admin';
}
