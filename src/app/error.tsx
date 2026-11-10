'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <h1 className="text-xl font-bold text-ink mb-2">일시적인 오류가 발생했습니다</h1>
      <p className="text-text-tertiary mb-8">잠시 후 다시 시도해주세요. 문제가 계속되면 고객센터로 문의해주세요.</p>
      <div className="flex gap-2 justify-center">
        <Button onClick={reset}>다시 시도</Button>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center px-5 py-2.5 text-[15px] font-medium bg-canvas text-ink border border-ink hover:bg-surface-soft rounded-[var(--radius-sm)]"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
