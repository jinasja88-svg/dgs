import { cn } from '@/lib/utils';

interface BadgeProps {
  status: string;
  className?: string;
}

const statusColors: Record<string, string> = {
  // 소싱 주문 상태
  pending: 'bg-warning-5 text-warning-60',
  paid: 'bg-info-5 text-info-60',
  purchasing: 'bg-primary-5 text-primary',
  shipping: 'bg-secondary-5 text-secondary-60',
  delivered: 'bg-success-5 text-success-60',
  cancelled: 'bg-danger-5 text-danger',
  refunded: 'bg-gray-100 text-gray-500',
  // CS 문의 상태
  open: 'bg-warning-5 text-warning-60',
  in_progress: 'bg-info-5 text-info-60',
  answered: 'bg-success-5 text-success-60',
  closed: 'bg-gray-100 text-gray-500',
  // CS 반품 상태
  requested: 'bg-warning-5 text-warning-60',
  reviewing: 'bg-info-5 text-info-60',
  approved: 'bg-success-5 text-success-60',
  rejected: 'bg-danger-5 text-danger',
  completed: 'bg-secondary-5 text-secondary-60',
};

const statusLabels: Record<string, string> = {
  // 소싱 주문 상태
  pending: '주문 접수',
  paid: '결제 완료',
  purchasing: '구매 진행중',
  shipping: '배송중',
  delivered: '배송 완료',
  cancelled: '취소됨',
  refunded: '환불됨',
  // CS 문의 상태
  open: '접수됨',
  in_progress: '처리중',
  answered: '답변 완료',
  closed: '종료',
  // CS 반품 상태
  requested: '신청됨',
  reviewing: '검토중',
  approved: '승인됨',
  rejected: '반려됨',
  completed: '처리 완료',
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
