'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import toast from 'react-hot-toast';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import { getSourcingStatusLabel } from '@/lib/utils';
import type { CSReturnType, CSReturnReason, SourcingOrder } from '@/types';

const BREADCRUMB = [
  { label: '마이페이지', href: '/mypage' },
  { label: '반품/교환', href: '/mypage/returns' },
  { label: '신청하기' },
];

const RETURN_TYPE_OPTIONS: { value: CSReturnType; label: string }[] = [
  { value: 'return', label: '반품' },
  { value: 'exchange', label: '교환' },
];

const REASON_OPTIONS: { value: CSReturnReason; label: string }[] = [
  { value: 'defective', label: '불량·파손' },
  { value: 'wrong_item', label: '오배송' },
  { value: 'not_as_described', label: '상품 설명과 다름' },
  { value: 'changed_mind', label: '단순 변심' },
  { value: 'other', label: '기타' },
];

const SELECT_CLASS =
  'w-full px-3 py-2.5 border border-border rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20';

export default function NewReturnPage() {
  const router = useRouter();

  const [orderId, setOrderId] = useState('');
  const [returnType, setReturnType] = useState<CSReturnType | ''>('');
  const [reason, setReason] = useState<CSReturnReason | ''>('');
  const [detail, setDetail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: deliveredOrders } = useQuery<SourcingOrder[]>({
    queryKey: ['delivered-orders'],
    queryFn: async () => {
      const res = await fetch('/api/sourcing/orders');
      const data: SourcingOrder[] = await res.json();
      return data.filter((o) => o.status === 'delivered');
    },
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!orderId || !returnType || !reason) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/cs/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, return_type: returnType, reason, detail }),
      });

      if (res.status === 409) {
        toast.error('이미 반품/교환 신청이 접수된 주문입니다');
        return;
      }

      if (!res.ok) throw new Error();

      toast.success('반품/교환 신청이 접수되었습니다');
      router.push('/mypage/returns');
    } catch {
      toast.error('신청 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={BREADCRUMB} />

      <h1 className="text-2xl font-bold text-text-primary mt-6 mb-8">반품/교환 신청</h1>

      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-border rounded-[var(--radius-lg)] p-5 space-y-5">

          {/* Order select */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              주문 선택 <span className="text-danger">*</span>
            </label>
            {deliveredOrders !== undefined && deliveredOrders.length === 0 ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-info-5 border border-info-20 rounded-[var(--radius-md)] text-sm text-info-60">
                <Info className="w-4 h-4 shrink-0" />
                <span>배송 완료된 주문이 없습니다.</span>
              </div>
            ) : (
              <select
                required
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">주문을 선택하세요</option>
                {deliveredOrders?.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.order_number} — {getSourcingStatusLabel(order.status)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Return type */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              신청 유형 <span className="text-danger">*</span>
            </label>
            <select
              required
              value={returnType}
              onChange={(e) => setReturnType(e.target.value as CSReturnType)}
              className={SELECT_CLASS}
            >
              <option value="">유형을 선택하세요</option>
              {RETURN_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              사유 <span className="text-danger">*</span>
            </label>
            <select
              required
              value={reason}
              onChange={(e) => setReason(e.target.value as CSReturnReason)}
              className={SELECT_CLASS}
            >
              <option value="">사유를 선택하세요</option>
              {REASON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Detail */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              상세 내용 <span className="text-danger">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="상세 내용을 입력해 주세요"
              className={`${SELECT_CLASS} resize-none`}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="tertiary"
            size="md"
            onClick={() => router.push('/mypage/returns')}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            disabled={isSubmitting || !deliveredOrders?.length}
          >
            신청 접수
          </Button>
        </div>
      </form>
    </div>
  );
}
