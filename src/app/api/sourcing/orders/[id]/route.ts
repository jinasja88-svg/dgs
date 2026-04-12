import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('sourcing_orders')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}

// 일반 사용자가 변경 가능한 필드 (취소만 허용)
const USER_ALLOWED_FIELDS = ['status'] as const;
// 유효한 상태 전이 맵
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['cancelled'],
  paid: ['cancelled'],
  purchasing: [],
  shipping: [],
  delivered: [],
  cancelled: [],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = await request.json();

  // 현재 주문 조회
  const { data: currentOrder } = await supabase
    .from('sourcing_orders')
    .select('status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!currentOrder) {
    return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
  }

  // 일반 사용자는 허용된 필드만 변경 가능
  const updateData: Record<string, unknown> = {};
  for (const key of USER_ALLOWED_FIELDS) {
    if (key in body) updateData[key] = body[key];
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: '변경할 항목이 없습니다.' }, { status: 400 });
  }

  // 상태 전이 검증
  if (updateData.status) {
    const allowed = VALID_STATUS_TRANSITIONS[currentOrder.status] || [];
    if (!allowed.includes(updateData.status as string)) {
      return NextResponse.json({
        error: `현재 상태(${currentOrder.status})에서 ${updateData.status}로 변경할 수 없습니다.`,
      }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from('sourcing_orders')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
