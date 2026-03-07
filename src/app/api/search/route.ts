import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get('q') || '';
  const supabase = await createServerSupabaseClient();

  if (!keyword) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from('products')
    .select('id, title, slug, price, discount_price, thumbnail_url')
    .eq('is_published', true)
    .ilike('title', `%${keyword}%`)
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
