'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Info } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Skeleton from '@/components/ui/Skeleton';
import { formatDate, getCSInquiryCategoryLabel } from '@/lib/utils';
import type { CSInquiry } from '@/types';

const BREADCRUMB = [
  { label: '마이페이지', href: '/mypage' },
  { label: '1:1 문의', href: '/mypage/inquiries' },
  { label: '문의 상세' },
];

export default function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params as Promise<{ id: string }>);

  const { data: inquiry, isLoading } = useQuery<CSInquiry>({
    queryKey: ['inquiry', id],
    queryFn: () => fetch('/api/cs/inquiries/' + id).then((r) => r.json()),
    enabled: !!id,
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={BREADCRUMB} />

      <div className="mt-6 mb-8">
        {isLoading ? (
          <Skeleton className="h-8 w-64" />
        ) : inquiry ? (
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-text-primary">{inquiry.title}</h1>
            <Badge status={inquiry.status} />
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-32" />
        </div>
      ) : !inquiry ? (
        <div className="text-center py-20">
          <p className="text-text-tertiary">문의를 찾을 수 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-text-tertiary">
            <span>{getCSInquiryCategoryLabel(inquiry.category)}</span>
            <span>·</span>
            <span>{formatDate(inquiry.created_at)}</span>
          </div>

          {/* Inquiry content */}
          <div className="bg-white border border-border rounded-[var(--radius-lg)] p-5">
            <h2 className="text-sm font-semibold text-text-secondary mb-3">문의 내용</h2>
            <div className="bg-surface rounded-[var(--radius-md)] p-4">
              <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                {inquiry.content}
              </p>
            </div>
          </div>

          {/* Admin reply */}
          {inquiry.admin_reply ? (
            <div className="bg-white border border-border rounded-[var(--radius-lg)] p-5">
              <h2 className="text-sm font-semibold text-text-secondary mb-3">답변</h2>
              <div className="bg-primary-5 rounded-[var(--radius-md)] p-4">
                <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                  {inquiry.admin_reply}
                </p>
              </div>
              {inquiry.admin_replied_at && (
                <p className="text-xs text-text-tertiary mt-2 text-right">
                  {formatDate(inquiry.admin_replied_at)}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-2.5 bg-info-5 border border-info-20 rounded-[var(--radius-md)] p-4">
              <Info className="w-4 h-4 text-info-60 mt-0.5 shrink-0" />
              <p className="text-sm text-info-60">
                담당자 확인 후 빠르게 답변 드리겠습니다.
              </p>
            </div>
          )}

          {/* Back link */}
          <div className="pt-2">
            <Link
              href="/mypage/inquiries"
              className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              목록으로 돌아가기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
