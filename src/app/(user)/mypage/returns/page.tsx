'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { formatDate, getCSReturnReasonLabel, getCSReturnTypeLabel } from '@/lib/utils';
import type { CSReturn } from '@/types';

const BREADCRUMB = [
  { label: '마이페이지', href: '/mypage' },
  { label: '반품/교환' },
];

export default function ReturnsPage() {
  const { data: returns, isLoading } = useQuery<CSReturn[]>({
    queryKey: ['my-returns'],
    queryFn: () => fetch('/api/cs/returns').then((r) => r.json()),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={BREADCRUMB} />

      <div className="flex items-center justify-between mt-6 mb-8">
        <h1 className="text-2xl font-bold text-text-primary">반품/교환</h1>
        <Link href="/mypage/returns/new">
          <Button variant="primary" size="md">반품/교환 신청</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : !returns?.length ? (
        <div className="text-center py-20">
          <RotateCcw className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <p className="text-text-tertiary">반품/교환 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map((item) => (
            <Link
              key={item.id}
              href={`/mypage/returns/${item.id}`}
              className="block"
            >
              <div className="bg-white border border-border rounded-[var(--radius-lg)] p-5 hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-tertiary mb-1">
                      {getCSReturnTypeLabel(item.return_type)}
                    </p>
                    <p className="font-medium text-text-primary truncate">
                      {getCSReturnReasonLabel(item.reason)}
                    </p>
                    <p className="text-xs text-text-tertiary mt-1">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                  <Badge status={item.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
