import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, data } = body;

    const supabase = createAdminClient();

    if (eventType === 'PAYMENT_STATUS_CHANGED') {
      const { orderId, status } = data;
      const mappedStatus = status === 'DONE' ? 'paid' : status === 'CANCELED' ? 'cancelled' : 'pending';

      await supabase
        .from('orders')
        .update({ status: mappedStatus })
        .eq('order_number', orderId);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Webhook 처리 실패' }, { status: 500 });
  }
}
