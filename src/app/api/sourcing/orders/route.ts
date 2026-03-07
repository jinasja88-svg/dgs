import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { generateOrderNumber } from '@/lib/utils';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('sourcing_orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = await request.json();
  const { items, total_cny, total_krw, service_fee, shipping_fee, shipping_address } = body;

  const { data, error } = await supabase
    .from('sourcing_orders')
    .insert({
      user_id: user.id,
      order_number: generateOrderNumber(),
      items,
      total_cny,
      total_krw,
      service_fee,
      shipping_fee: shipping_fee || 3000,
      shipping_address,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
