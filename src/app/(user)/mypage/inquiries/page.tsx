'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { formatDate, getCSInquiryCategoryLabel } from '@/lib/utils';
import type { CSInquiry } from '@/types';

const BREADCRUMB = [
  { label: '마이페이지', href: '/mypage' },
  { label: '1:1 문의' },
];

export default function InquiriesPage() {
  const { data: inquiries, isLoading } = useQuery<CSInquiry[]>({
    queryKey: ['my-inquiries'],
    queryFn: () => fetch('/api/cs/inquiries').then((r) => r.json()),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={BREADCRUMB} />

      <div className="flex items-center justify-between mt-6 mb-8">
        <h1 className="text-2xl font-bold text-text-primary">1:1 문의</h1>
        <Link href="/mypage/inquiries/new">
          <Button variant="primary" size="md">문의하기</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : !inquiries?.length ? (
        <div className="text-center py-20">
          <MessageSquare className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <p className="text-text-tertiary">
            문의 내역이 없습니다. 궁금한 점을 문의해 주세요.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inquiry) => (
            <Link
              key={inquiry.id}
              href={`/mypage/inquiries/${inquiry.id}`}
              className="block"
            >
              <div className="bg-white border border-border rounded-[var(--radius-lg)] p-5 hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-tertiary mb-1">
                      {getCSInquiryCategoryLabel(inquiry.category)}
                    </p>
                    <p className="font-medium text-text-primary truncate">
                      {inquiry.title}
                    </p>
                    <p className="text-xs text-text-tertiary mt-1">
                      {formatDate(inquiry.created_at)}
                    </p>
                    {inquiry.status === 'answered' && (
                      <p className="text-xs text-success-60 font-medium mt-2">
                        답변이 완료되었습니다
                      </p>
                    )}
                  </div>
                  <Badge status={inquiry.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
