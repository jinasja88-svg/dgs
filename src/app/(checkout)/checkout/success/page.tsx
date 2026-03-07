'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-6" />
      <h1 className="text-2xl font-bold text-text-primary mb-2">결제 완료!</h1>
      <p className="text-text-secondary mb-2">주문이 성공적으로 처리되었습니다.</p>
      {orderId && <p className="text-sm text-text-tertiary mb-8">주문번호: {orderId}</p>}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/sourcing-orders"
          className="px-6 py-3 bg-primary text-white rounded-[var(--radius-md)] font-medium hover:bg-primary-60 transition-colors"
        >
          주문 내역 보기
        </Link>
        <Link
          href="/shop"
          className="px-6 py-3 border border-border rounded-[var(--radius-md)] font-medium text-text-secondary hover:bg-surface transition-colors"
        >
          계속 쇼핑하기
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
