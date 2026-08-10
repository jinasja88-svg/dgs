import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

// PATCH /api/addresses/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });

  let body: Partial<{
    label: string;
    recipient: string;
    phone: string;
    address: string;
    address_detail: string;
    postal_code: string;
    is_default: boolean;
  }>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 });
  }

  const updateData: Partial<{
    label: string;
    recipient: string;
    phone: string;
    address: string;
    address_detail: string | null;
    postal_code: string | null;
    is_default: boolean;
  }> = {};

  if (body.label !== undefined) {
    const label = clean(body.label);
    if (!label) return NextResponse.json({ error: '배송지 이름을 입력해주세요' }, { status: 400 });
    updateData.label = label;
  }
  if (body.recipient !== undefined) {
    const recipient = clean(body.recipient);
    if (!recipient) return NextResponse.json({ error: '받는 분을 입력해주세요' }, { status: 400 });
    updateData.recipient = recipient;
  }
  if (body.phone !== undefined) {
    const phone = clean(body.phone);
    if (!phone) return NextResponse.json({ error: '연락처를 입력해주세요' }, { status: 400 });
    updateData.phone = phone;
  }
  if (body.address !== undefined) {
    const address = clean(body.address);
    if (!address) return NextResponse.json({ error: '주소를 입력해주세요' }, { status: 400 });
    updateData.address = address;
  }
  if (body.address_detail !== undefined) updateData.address_detail = clean(body.address_detail) || null;
  if (body.postal_code !== undefined) updateData.postal_code = clean(body.postal_code) || null;
  if (body.is_default !== undefined) updateData.is_default = Boolean(body.is_default);

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: '수정할 항목이 없습니다' }, { status: 400 });
  }

  if (body.is_default) {
    await supabase
      .from('shipping_addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);
  }

  const { data, error } = await supabase
    .from('shipping_addresses')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/addresses/[id]
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });

  const { error } = await supabase
    .from('shipping_addresses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
