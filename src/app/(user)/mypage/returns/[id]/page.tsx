'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, XCircle } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Skeleton from '@/components/ui/Skeleton';
import { formatDate, formatPrice, getCSReturnReasonLabel, getCSReturnTypeLabel } from '@/lib/utils';
import type { CSReturn, CSReturnStatus } from '@/types';

const BREADCRUMB = [
  { label: '마이페이지', href: '/mypage' },
  { label: '반품/교환', href: '/mypage/returns' },
  { label: '상세' },
];

const TIMELINE_STEPS: { key: CSReturnStatus; label: string }[] = [
  { key: 'requested', label: '신청됨' },
  { key: 'reviewing', label: '검토중' },
  { key: 'approved', label: '승인됨' },
  { key: 'completed', label: '처리 완료' },
];

const STEP_ORDER = TIMELINE_STEPS.map((s) => s.key);

export default function ReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params as Promise<{ id: string }>);

  const { data: returnData, isLoading } = useQuery<CSReturn>({
    queryKey: ['return', id],
    queryFn: () => fetch(`/api/cs/returns/${id}`).then((r) => r.json()),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <Breadcrumb items={BREADCRUMB} />
        <Skeleton className="h-8 w-48 mt-6" />
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!returnData) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={BREADCRUMB} />
        <p className="text-text-tertiary text-center py-20">신청 내역을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const isRejected = returnData.status === 'rejected';
  const currentStepIndex = STEP_ORDER.indexOf(returnData.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={BREADCRUMB} />

      {/* Header */}
      <div className="flex items-center justify-between mt-6 mb-8">
        <h1 className="text-2xl font-bold text-text-primary">
          {getCSReturnTypeLabel(returnData.return_type)} 신청 상세
        </h1>
        <Badge status={returnData.status} />
      </div>

      {/* Status timeline */}
      <div className="bg-white border border-border rounded-[var(--radius-lg)] p-5 mb-4">
        {isRejected ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-danger-5 border border-danger/20 rounded-[var(--radius-md)]">
            <XCircle className="w-5 h-5 text-danger shrink-0" />
            <div>
              <p className="text-sm font-semibold text-danger">신청이 반려되었습니다</p>
              {returnData.admin_note && (
                <p className="text-xs text-danger/80 mt-0.5">{returnData.admin_note}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center">
            {TIMELINE_STEPS.map((step, index) => {
              const isCompleted = currentStepIndex > index;
              const isActive = currentStepIndex === index;
              const isLast = index === TIMELINE_STEPS.length - 1;

              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={[
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                        isCompleted
                          ? 'bg-primary text-white'
                          : isActive
                          ? 'bg-primary text-white ring-4 ring-primary/20'
                          : 'bg-gray-100 text-text-tertiary',
                      ].join(' ')}
                    >
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <span
                      className={[
                        'text-xs whitespace-nowrap',
                        isCompleted || isActive ? 'text-text-primary font-medium' : 'text-text-tertiary',
                      ].join(' ')}
                    >
                      {step.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={[
                        'flex-1 h-0.5 mx-2 mb-5 transition-colors',
                        isCompleted ? 'bg-primary' : 'bg-gray-200',
                      ].join(' ')}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info grid */}
      <div className="bg-white border border-border rounded-[var(--radius-lg)] p-5 mb-4">
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <dt className="text-xs text-text-tertiary mb-1">신청 유형</dt>
            <dd className="text-sm font-medium text-text-primary">
              {getCSReturnTypeLabel(returnData.return_type)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-tertiary mb-1">사유</dt>
            <dd className="text-sm font-medium text-text-primary">
              {getCSReturnReasonLabel(returnData.reason)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-tertiary mb-1">신청일</dt>
            <dd className="text-sm font-medium text-text-primary">
              {formatDate(returnData.created_at)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Detail content */}
      <div className="bg-white border border-border rounded-[var(--radius-lg)] p-5 mb-4">
        <h2 className="text-sm font-semibold text-text-primary mb-3">신청 내용</h2>
        <p className="text-sm text-text-secondary bg-surface rounded-[var(--radius-md)] px-4 py-3 whitespace-pre-wrap">
          {returnData.detail}
        </p>
      </div>

      {/* Refund amount */}
      {returnData.refund_amount != null && (
        <div className="bg-white border border-border rounded-[var(--radius-lg)] p-5 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">환불 예정 금액</span>
            <span className="text-base font-bold text-success-60">
              {formatPrice(returnData.refund_amount)}
            </span>
          </div>
        </div>
      )}

      {/* Admin note (only show here when NOT rejected, as rejected shows it inline above) */}
      {!isRejected && returnData.admin_note && (
        <div className="bg-white border border-border rounded-[var(--radius-lg)] p-5 mb-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3">담당자 메모</h2>
          <p className="text-sm text-text-secondary bg-surface rounded-[var(--radius-md)] px-4 py-3 whitespace-pre-wrap">
            {returnData.admin_note}
          </p>
        </div>
      )}

      {/* Back link */}
      <div className="mt-6">
        <Link
          href="/mypage/returns"
          className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          목록으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
