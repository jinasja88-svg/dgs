import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { paymentKey, orderId, amount } = await request.json();

  try {
    const secretKey = process.env.TOSS_SECRET_KEY;
    const encryptedSecretKey = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;

    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: encryptedSecretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.message || '결제 확인 실패' }, { status: 400 });
    }

    // Update order status
    await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_key: paymentKey,
        payment_method: data.method,
      })
      .eq('order_number', orderId)
      .eq('user_id', user.id);

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: '결제 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
