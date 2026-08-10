import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

// GET /api/addresses
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });

  const { data, error } = await supabase
    .from('shipping_addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/addresses
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });

  let body: Partial<{
    label: string;
    recipient: string;
    phone: string;
    address: string;
    address_detail?: string;
    postal_code?: string;
    is_default?: boolean;
  }>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 });
  }

  const normalized = {
    label: clean(body.label),
    recipient: clean(body.recipient),
    phone: clean(body.phone),
    address: clean(body.address),
    address_detail: clean(body.address_detail) || null,
    postal_code: clean(body.postal_code) || null,
    is_default: Boolean(body.is_default),
  };

  if (!normalized.label || !normalized.recipient || !normalized.phone || !normalized.address) {
    return NextResponse.json({ error: '필수 항목이 누락되었습니다' }, { status: 400 });
  }

  // 기본 배송지로 설정 시 기존 기본 배송지 해제
  if (normalized.is_default) {
    await supabase
      .from('shipping_addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);
  }

  // 첫 번째 배송지는 자동으로 기본
  const { count } = await supabase
    .from('shipping_addresses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { data, error } = await supabase
    .from('shipping_addresses')
    .insert({
      user_id: user.id,
      label: normalized.label,
      recipient: normalized.recipient,
      phone: normalized.phone,
      address: normalized.address,
      address_detail: normalized.address_detail,
      postal_code: normalized.postal_code,
      is_default: normalized.is_default || count === 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
