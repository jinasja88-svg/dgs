'use client';

import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Skeleton from '@/components/ui/Skeleton';
import { formatPrice, formatDate, getOrderStatusLabel } from '@/lib/utils';
import type { Order } from '@/types';

export default function OrdersPage() {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: () => fetch('/api/orders').then((r) => r.json()),
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: '마이페이지', href: '/mypage' }, { label: '주문 내역' }]} />

      <h1 className="text-2xl font-bold text-text-primary mt-6 mb-8">주문 내역</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : !orders?.length ? (
        <div className="text-center py-20">
          <Package className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <p className="text-text-tertiary">주문 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-border rounded-[var(--radius-md)] p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{order.order_number}</span>
                <Badge status={order.status} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-tertiary">{formatDate(order.created_at)}</span>
                <span className="font-bold">{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
