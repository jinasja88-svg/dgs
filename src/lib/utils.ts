import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { SourcingOrderStatus } from '@/types';

export function formatPrice(price: number): string {
  return `₩${price.toLocaleString('ko-KR')}`;
}

export function formatDate(dateString: string): string {
  return format(new Date(dateString), 'yyyy년 M월 d일', { locale: ko });
}

export function formatDateShort(dateString: string): string {
  return format(new Date(dateString), 'yyyy-MM-dd');
}

export function generateOrderNumber(): string {
  const date = format(new Date(), 'yyyyMMdd');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${date}-${random}`;
}

export function calcDiscountRate(price: number, discountPrice: number): number {
  if (!price || !discountPrice) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '결제 대기',
    paid: '결제 완료',
    cancelled: '취소됨',
    refunded: '환불됨',
  };
  return labels[status] || status;
}

export function getSourcingStatusLabel(status: SourcingOrderStatus): string {
  const labels: Record<SourcingOrderStatus, string> = {
    pending: '주문 접수',
    paid: '결제 완료',
    purchasing: '구매 진행중',
    shipping: '배송중',
    delivered: '배송 완료',
    cancelled: '취소됨',
  };
  return labels[status];
}

export function getPlanLabel(plan: string): string {
  const labels: Record<string, string> = {
    free: '무료',
    basic: '베이직',
    pro: '프로',
  };
  return labels[plan] || plan;
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}
