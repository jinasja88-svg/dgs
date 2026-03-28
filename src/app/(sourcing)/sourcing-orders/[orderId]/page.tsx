'use client';

import { use, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Circle, Truck, X, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Badge from '@/components/ui/Badge';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatPrice, formatDate, getSourcingStatusLabel } from '@/lib/utils';
import type { SourcingOrder, SourcingOrderStatus, SourcingReview } from '@/types';

const STATUS_FLOW: SourcingOrderStatus[] = ['pending', 'paid', 'purchasing', 'shipping', 'delivered'];

function StatusTimeline({ currentStatus }: { currentStatus: SourcingOrderStatus }) {
  if (currentStatus === 'cancelled') {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 rounded-[var(--radius-md)] text-sm text-danger">
        <Circle className="w-5 h-5" /> 주문이 취소되었습니다.
      </div>
    );
  }

  const currentIndex = STATUS_FLOW.indexOf(currentStatus);

  return (
    <div className="flex items-center justify-between py-4">
      {STATUS_FLOW.map((status, i) => (
        <div key={status} className="flex flex-col items-center flex-1">
          <div className="flex items-center w-full">
            {i > 0 && (
              <div className={`flex-1 h-0.5 ${i <= currentIndex ? 'bg-primary' : 'bg-border'}`} />
            )}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                i <= currentIndex ? 'bg-primary text-white' : 'bg-surface text-text-tertiary'
              }`}
            >
              {i < currentIndex ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : i === currentIndex ? (
                <Truck className="w-4 h-4" />
              ) : (
                <Circle className="w-4 h-4" />
              )}
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div className={`flex-1 h-0.5 ${i < currentIndex ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
          <span className={`text-xs mt-2 ${i <= currentIndex ? 'text-primary font-medium' : 'text-text-tertiary'}`}>
            {getSourcingStatusLabel(status)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SourcingOrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const { data: order, isLoading } = useQuery<SourcingOrder>({
    queryKey: ['sourcing-order', orderId],
    queryFn: () => fetch(`/api/sourcing/orders/${orderId}`).then((r) => r.json()),
  });

  const { data: existingReview } = useQuery<SourcingReview | null>({
    queryKey: ['sourcing-review', orderId],
    queryFn: async () => {
      const r = await fetch(`/api/sourcing/reviews?order_id=${orderId}`);
      const data = await r.json();
      return Array.isArray(data) && data.length > 0 ? data[0] : null;
    },
    enabled: order?.status === 'delivered',
  });

  const handleReviewSubmit = async () => {
    if (reviewRating === 0) { toast.error('별점을 선택해주세요'); return; }
    setIsSubmittingReview(true);
    try {
      const res = await fetch('/api/sourcing/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, rating: reviewRating, comment: reviewComment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '리뷰 저장 실패');
      toast.success('리뷰가 등록되었습니다!');
      queryClient.invalidateQueries({ queryKey: ['sourcing-review', orderId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '오류가 발생했습니다');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/sourcing/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: ['sourcing-order', orderId] });
        await queryClient.invalidateQueries({ queryKey: ['sourcing-orders'] });
        setShowCancelModal(false);
      }
    } finally {
      setCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-20" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!order || 'error' in order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-text-tertiary mb-4">주문을 찾을 수 없습니다.</p>
        <Link href="/sourcing-orders" className="text-primary hover:underline">돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: '홈', href: '/' },
          { label: '소싱 주문', href: '/sourcing-orders' },
          { label: order.order_number },
        ]}
      />

      <Link href="/sourcing-orders" className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-primary mt-4 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> 목록으로
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{order.order_number}</h1>
        <Badge status={order.status} />
      </div>

      {/* Timeline */}
      <div className="bg-white border border-border rounded-[var(--radius-lg)] p-6 mb-6">
        <h2 className="text-sm font-semibold mb-4">주문 상태</h2>
        <StatusTimeline currentStatus={order.status} />
        {order.tracking_number && (
          <div className="mt-4 p-3 bg-surface rounded-[var(--radius-md)] text-sm">
            <span className="text-text-tertiary">운송장 번호: </span>
            <span className="font-medium">{order.tracking_number}</span>
          </div>
        )}
        {order.status === 'pending' && (
          <div className="mt-4 pt-4 border-t border-border-light">
            <button
              onClick={() => setShowCancelModal(true)}
              className="text-sm text-danger hover:underline"
            >
              주문 취소
            </button>
          </div>
        )}
        {order.status !== 'pending' && order.status !== 'cancelled' && order.status !== 'delivered' && (
          <div className="mt-4 pt-4 border-t border-border-light">
            <p className="text-xs text-text-tertiary">
              취소가 필요하신 경우 <a href="/contact" className="text-primary hover:underline">관리자에게 문의</a>해 주세요.
            </p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white border border-border rounded-[var(--radius-lg)] p-6 mb-6">
        <h2 className="text-sm font-semibold mb-4">주문 상품</h2>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-14 h-14 bg-surface rounded-[var(--radius-sm)] flex items-center justify-center text-2xl flex-shrink-0">
                📦
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                {item.sku_name && <p className="text-xs text-text-tertiary">{item.sku_name}</p>}
                <p className="text-xs text-text-tertiary">수량: {item.quantity}개</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-medium">{formatPrice(item.price_krw * item.quantity)}</p>
                <p className="text-xs text-text-tertiary">¥{item.price_cny * item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Summary */}
      <div className="bg-white border border-border rounded-[var(--radius-lg)] p-6 mb-6">
        <h2 className="text-sm font-semibold mb-4">결제 정보</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">상품 금액</span>
            <span>{formatPrice(order.total_krw)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">서비스 수수료</span>
            <span>{formatPrice(order.service_fee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">배송비</span>
            <span>{formatPrice(order.shipping_fee)}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
            <span>총 결제 금액</span>
            <span className="text-primary">
              {formatPrice(order.total_krw + order.service_fee + order.shipping_fee)}
            </span>
          </div>
        </div>
      </div>

      {/* Order info */}
      <div className="bg-white border border-border rounded-[var(--radius-lg)] p-6">
        <h2 className="text-sm font-semibold mb-4">주문 정보</h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-text-tertiary">주문일</dt>
          <dd>{formatDate(order.created_at)}</dd>
          {order.shipping_address && (
            <>
              <dt className="text-text-tertiary">배송지</dt>
              <dd>{order.shipping_address.address} {order.shipping_address.detail_address}</dd>
            </>
          )}
        </dl>
      </div>

      {/* 리뷰 섹션 (배송 완료 시) */}
      {order.status === 'delivered' && (
        <div className="bg-white border border-border rounded-[var(--radius-lg)] p-6 mt-6">
          <h2 className="text-sm font-semibold mb-4">소싱 후기</h2>
          {existingReview ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-5 h-5 ${s <= existingReview.rating ? 'text-warning fill-warning' : 'text-border'}`}
                  />
                ))}
                <span className="text-xs text-text-tertiary ml-2">{formatDate(existingReview.created_at)}</span>
              </div>
              {existingReview.comment && (
                <p className="text-sm text-text-secondary">{existingReview.comment}</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-text-tertiary mb-2">이번 소싱은 어떠셨나요?</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewRating(s)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${s <= reviewRating ? 'text-warning fill-warning' : 'text-border hover:text-warning'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="소싱 경험을 간단히 작성해주세요 (선택)"
                maxLength={200}
                rows={3}
                className="w-full border border-border rounded-[var(--radius-md)] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <Button
                size="sm"
                onClick={handleReviewSubmit}
                isLoading={isSubmittingReview}
                disabled={reviewRating === 0}
              >
                리뷰 등록
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 취소 확인 모달 */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="주문 취소">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            주문 <span className="font-medium text-text-primary">{order.order_number}</span>을 취소하시겠습니까?
          </p>
          <p className="text-xs text-danger bg-danger/5 rounded-[var(--radius-md)] px-3 py-2">
            취소 후에는 되돌릴 수 없습니다.
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              variant="tertiary"
              className="flex-1"
              onClick={() => setShowCancelModal(false)}
              disabled={cancelling}
            >
              돌아가기
            </Button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 py-2.5 px-4 rounded-[var(--radius-md)] bg-danger text-white text-sm font-medium hover:bg-danger/90 disabled:opacity-50 transition-colors"
            >
              {cancelling ? '취소 중...' : '주문 취소'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
