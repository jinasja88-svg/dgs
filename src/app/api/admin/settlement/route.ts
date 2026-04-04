import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  if (!(await isAdmin(user.id))) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });

  const admin = createAdminClient();
  const { searchParams } = new URL(request.url);

  const now = new Date();
  const year = parseInt(searchParams.get('year') ?? String(now.getFullYear()), 10);
  const month = parseInt(searchParams.get('month') ?? String(now.getMonth() + 1), 10);

  // Build inclusive date range for the target month
  const start = `${year}-${String(month).padStart(2, '0')}-01 00:00:00`;
  const lastDay = new Date(year, month, 0).getDate(); // day 0 of next month = last day of target month
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')} 23:59:59`;

  const { data: orders, error } = await admin
    .from('sourcing_orders')
    .select('id, order_number, user_id, status, total_krw, service_fee, created_at')
    .gte('created_at', start)
    .lte('created_at', end);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = orders ?? [];

  // Aggregate by status
  const byStatus: Record<string, { count: number; total_krw: number }> = {};
  let total_krw = 0;
  let total_service_fee = 0;
  let cancelled_krw = 0;
  let delivered_count = 0;

  for (const order of rows) {
    const status = order.status ?? 'unknown';
    const krw = order.total_krw ?? 0;
    const fee = order.service_fee ?? 0;

    if (!byStatus[status]) byStatus[status] = { count: 0, total_krw: 0 };
    byStatus[status].count += 1;
    byStatus[status].total_krw += krw;

    total_krw += krw;
    total_service_fee += fee;

    if (status === 'cancelled') cancelled_krw += krw;
    if (status === 'delivered') delivered_count += 1;
  }

  // Last 20 delivered orders, newest first
  const recent_delivered = rows
    .filter((o) => o.status === 'delivered')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20)
    .map(({ id, order_number, user_id, total_krw, service_fee, created_at }) => ({
      id,
      order_number,
      user_id,
      total_krw,
      service_fee,
      created_at,
    }));

  return NextResponse.json({
    year,
    month,
    summary: {
      total_orders: rows.length,
      total_krw,
      total_service_fee,
      cancelled_krw,
      delivered_count,
    },
    by_status: byStatus,
    recent_delivered,
  });
}
