'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4" />
      <h1 className="font-heading text-2xl font-bold mb-4">결제</h1>
      {orderId ? (
        <div className="bg-surface rounded-[var(--radius-lg)] p-6 mb-6">
          <p className="text-sm text-text-secondary mb-2">주문번호: {orderId}</p>
          <p className="text-sm text-text-tertiary">
            Toss 결제 연동은 실제 키 설정 후 이용 가능합니다.
          </p>
        </div>
      ) : (
        <p className="text-text-tertiary mb-6">결제할 주문이 없습니다.</p>
      )}
      <Link href="/shop" className="text-primary hover:underline text-sm">
        소싱하러 가기
      </Link>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
