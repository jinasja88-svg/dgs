'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import { getSourcingStatusLabel } from '@/lib/utils';
import type { CSInquiryCategory, SourcingOrder } from '@/types';

const BREADCRUMB = [
  { label: '마이페이지', href: '/mypage' },
  { label: '1:1 문의', href: '/mypage/inquiries' },
  { label: '문의 작성' },
];

const CATEGORY_OPTIONS: { value: CSInquiryCategory; label: string }[] = [
  { value: 'order', label: '주문' },
  { value: 'shipping', label: '배송' },
  { value: 'return', label: '반품·교환' },
  { value: 'product', label: '상품' },
  { value: 'payment', label: '결제' },
  { value: 'other', label: '기타' },
];

const SELECT_CLASS =
  'w-full px-3 py-2.5 border border-border rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20';

export default function NewInquiryPage() {
  const router = useRouter();

  const [category, setCategory] = useState<CSInquiryCategory | ''>('');
  const [orderId, setOrderId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: orders } = useQuery<SourcingOrder[]>({
    queryKey: ['my-orders-for-inquiry'],
    queryFn: () => fetch('/api/sourcing/orders').then((r) => r.json()),
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!category) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/cs/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          ...(orderId ? { order_id: orderId } : {}),
          title,
          content,
        }),
      });

      if (!res.ok) throw new Error('문의 접수에 실패했습니다.');

      toast.success('문의가 접수되었습니다');
      router.push('/mypage/inquiries');
    } catch {
      toast.error('문의 접수 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={BREADCRUMB} />

      <h1 className="text-2xl font-bold text-text-primary mt-6 mb-8">문의 작성</h1>

      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-border rounded-[var(--radius-lg)] p-5 space-y-5">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              문의 유형 <span className="text-danger">*</span>
            </label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value as CSInquiryCategory)}
              className={SELECT_CLASS}
            >
              <option value="">유형을 선택하세요</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Related order (optional) */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              관련 주문 선택 <span className="text-text-tertiary font-normal">(선택사항)</span>
            </label>
            <select
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">주문을 선택하세요</option>
              {orders?.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.order_number} - {getSourcingStatusLabel(order.status)}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              제목 <span className="text-danger">*</span>
            </label>
            <input
              required
              type="text"
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className={SELECT_CLASS}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              내용 <span className="text-danger">*</span>
            </label>
            <textarea
              required
              rows={6}
              maxLength={1000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="문의 내용을 자세히 입력해 주세요"
              className={`${SELECT_CLASS} resize-none`}
            />
            <p className="text-xs text-text-tertiary text-right mt-1">
              {content.length}/1000
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="tertiary"
            size="md"
            onClick={() => router.push('/mypage/inquiries')}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            문의 접수
          </Button>
        </div>
      </form>
    </div>
  );
}
