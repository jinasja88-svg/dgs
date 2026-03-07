import { cn } from '@/lib/utils';
import type { SourcingOrderStatus } from '@/types';

interface BadgeProps {
  status: string;
  className?: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-warning-5 text-warning-60',
  paid: 'bg-info-5 text-info-60',
  purchasing: 'bg-primary-5 text-primary',
  shipping: 'bg-secondary-5 text-secondary-60',
  delivered: 'bg-success-5 text-success-60',
  cancelled: 'bg-danger-5 text-danger',
  refunded: 'bg-gray-5 text-gray-60',
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
        statusColors[status] || 'bg-gray-5 text-gray-60',
        className
      )}
    >
      {statusLabels[status] || status}
    </span>
  );
}
