'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import Badge from '@/components/ui/Badge';
import { formatPrice, formatDate } from '@/lib/utils';
import type { Order } from '@/types';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setOrders(data as Order[]);
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-text-primary mb-6">일반 주문 관리</h1>

      {!orders.length ? (
        <p className="text-text-tertiary text-center py-12">주문이 없습니다.</p>
      ) : (
        <div className="bg-white rounded-[var(--radius-lg)] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">주문번호</th>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">상태</th>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">금액</th>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">결제방법</th>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">날짜</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface/50">
                    <td className="px-4 py-3 font-medium">{order.order_number}</td>
                    <td className="px-4 py-3"><Badge status={order.status} /></td>
                    <td className="px-4 py-3">{formatPrice(order.total_amount)}</td>
                    <td className="px-4 py-3 text-text-tertiary">{order.payment_method || '-'}</td>
                    <td className="px-4 py-3 text-text-tertiary">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
