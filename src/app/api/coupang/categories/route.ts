import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('coupang_products')
    .select('category_l1')
    .order('category_l1');

  if (error) {
    console.error('Coupang categories error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 중복 제거
  const unique = [...new Set((data || []).map((d) => d.category_l1).filter(Boolean))];
  return NextResponse.json({ categories: unique });
}
