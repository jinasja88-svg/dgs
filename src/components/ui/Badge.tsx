import { cn } from '@/lib/utils';
import type { SourcingOrderStatus } from '@/types';

interface BadgeProps {
  status: string;
  className?: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  purchasing: 'bg-indigo-100 text-indigo-800',
  shipping: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  pending: '주문 접수',
  paid: '결제 완료',
  purchasing: '구매 진행중',
  shipping: '배송중',
  delivered: '배송 완료',
  cancelled: '취소됨',
  refunded: '환불됨',
};

export default function Badge({ status, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusColors[status] || 'bg-gray-100 text-gray-800',
        className
      )}
    >
      {statusLabels[status] || status}
    </span>
  );
}
