'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Package } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { formatPrice, formatDate } from '@/lib/utils';
import type { SourcingOrder } from '@/types';

export default function SourcingOrdersPage() {
  const { data: orders, isLoading } = useQuery<SourcingOrder[]>({
    queryKey: ['sourcing-orders'],
    queryFn: () => fetch('/api/sourcing/orders').then((r) => r.json()),
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">내주문목록</h1>
        <p className="text-sm text-text-tertiary mt-1">소싱 주문 내역을 확인하세요</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : !orders?.length ? (
        <div className="text-center py-20">
          <Package className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <p className="text-text-tertiary mb-4">아직 소싱 주문이 없습니다.</p>
          <Link
            href="/shop"
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-[var(--radius-md)] font-medium hover:bg-primary-60 transition-colors"
          >
            소싱하러 가기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/sourcing-orders/${order.id}`}
              className="block bg-white border border-border rounded-[var(--radius-lg)] p-5 hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-text-primary">{order.order_number}</span>
                  <Badge status={order.status} />
                </div>
                <span className="text-xs text-text-tertiary">{formatDate(order.created_at)}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-surface rounded-[var(--radius-sm)] flex items-center justify-center text-xl">
                  📦
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">
                    {order.items[0]?.title}
                    {order.items.length > 1 && ` 외 ${order.items.length - 1}건`}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    수량: {order.items.reduce((sum, item) => sum + item.quantity, 0)}개
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">
                    {formatPrice(order.total_krw + order.service_fee + order.shipping_fee)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
